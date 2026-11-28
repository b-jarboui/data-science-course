// 14.1.6 Hierarchical clustering: building a tree of groups.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Laptop: station grid on the left the whole time, tree (dendrogram) on the right from beat 20.
// Phone: big grid first; from beat 20 a small grid on top and the tree filling the lower half.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const data = [[1, 1], [2, 2], [3, 3], [7, 1], [8, 2], [9, 6]];
  const names = 'ABCDEF';
  const blue = '#60a5fa', orange = '#fb923c', purple = C.violet;

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
  function seg(a, b, color, isDashed = false, ly = lay) {
    const pa = pos(a, ly), pb = pos(b, ly);
    const d = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
    const ux = (pb[0] - pa[0]) / d, uy = (pb[1] - pa[1]) / d, r = 0.14;
    const s = [pa[0] + ux * r, pa[1] + uy * r, 0], e = [pb[0] - ux * r, pb[1] - uy * r, 0];
    return isDashed ? dashed(s, e, color) : line(s, e, color, 3.5);
  }
  // solid merge links shown in the grid: key 'ab' -> { a, b, color, obj }
  const links = {};
  function addLink(a, b, color) {
    const obj = seg(a, b, color);
    links[`${a}${b}`] = { a, b, color, obj };
    return create(obj, 0.5);
  }
  function dropLink(a, b) {
    const k = `${a}${b}`, l = links[k];
    delete links[k];
    return l ? [fadeOut(l.obj)] : [];
  }
  function recolor(i, color) {
    if (cols[i] === color) return [];
    cols[i] = color;
    const next = makeDot(i, color);
    const a = new M.Transform(dots[i], next, { runTime: 0.5 });
    return [a];
  }
  let temp = [];
  const clearTemp = () => { const a = temp.map(m => fadeOut(m)); temp = []; return a; };
  function showTemp(...objs) { temp.push(...objs); return objs.map(o => create(o, 0.5)); }

  // ---------- dendrogram ----------
  const DAX = P ? -3.4 : -0.7;
  const LX = names.split('').map((_, i) => P ? -2.9 + i * 1.16 : -0.1 + i * 1.15);
  const DB = P ? -5.75 : -3.0, DS = P ? 0.68 : 0.66;
  const hy = h => DB + h * DS;
  const tree = [];
  {
    tree.push(line([DAX, hy(0), 0], [DAX, hy(5), 0], C.muted, 2));
    tree.push(line([DAX, hy(0), 0], [LX[5] + 0.35, hy(0), 0], C.muted, 2));
    for (let h = 0; h <= 5; h++) {
      tree.push(line([DAX - 0.06, hy(h), 0], [DAX + 0.06, hy(h), 0], C.muted, 1.5));
      tree.push(label(String(h), DAX - 0.26, hy(h), P ? 19 : 15, C.muted));
    }
    tree.push(label('↑ Merge distance', P ? -2.3 : -0.2, hy(5) + 0.32, P ? 19 : 17, C.ink, false));
    names.split('').forEach((n, i) => tree.push(label(n, LX[i], DB - 0.3, P ? 22 : 18, C.ink, true, true)));
  }
  const treeAxes = new M.VGroup(...tree);
  const H1 = Math.SQRT2, H4 = Math.sqrt(17), H5 = Math.sqrt(20);
  const abX = (LX[0] + LX[1]) / 2, abcX = (abX + LX[2]) / 2, deX = (LX[3] + LX[4]) / 2, defX = (deX + LX[5]) / 2;
  const vline = (x, h0, h1, color) => line([x, hy(h0), 0], [x, hy(h1), 0], color, 3);
  const hline = (x0, x1, h, color) => line([x0, hy(h), 0], [x1, hy(h), 0], color, 3);
  const heightTag = (s, x, h, color) => label(s, x, hy(h) + (P ? 0.24 : 0.2), P ? 19 : 16, color);
  const brAB = new M.VGroup(vline(LX[0], 0, H1, blue), vline(LX[1], 0, H1, blue), hline(LX[0], LX[1], H1, blue),
    heightTag('1.41', abX, H1, blue));
  const brC = new M.VGroup(vline(LX[2], 0, H1, blue), hline(abX, LX[2], H1, blue));
  const brDE = new M.VGroup(vline(LX[3], 0, H1, orange), vline(LX[4], 0, H1, orange), hline(LX[3], LX[4], H1, orange),
    heightTag('1.41', LX[3] - 0.4, H1, orange)); // left of D: the DE + F branch later rises from the middle
  const def = (color, isDashed) => {
    const mk = isDashed ? (a, b) => dashed(a, b, C.muted, 2) : (a, b) => line(a, b, color, 3);
    return new M.VGroup(mk([deX, hy(H1), 0], [deX, hy(H4), 0]), mk([LX[5], hy(0), 0], [LX[5], hy(H4), 0]),
      mk([deX, hy(H4), 0], [LX[5], hy(H4), 0]));
  };
  const top = (color, isDashed) => {
    const mk = isDashed ? (a, b) => dashed(a, b, C.muted, 2) : (a, b) => line(a, b, color, 3);
    return new M.VGroup(mk([abcX, hy(H1), 0], [abcX, hy(H5), 0]), mk([defX, hy(H4), 0], [defX, hy(H5), 0]),
      mk([abcX, hy(H5), 0], [defX, hy(H5), 0]));
  };
  let brDEF = def(orange, false), brTop = top(C.cyan, false);
  const tagDEF = label('4.12', LX[5] + (P ? 0.42 : 0.4), hy(H4) - 0.22, P ? 19 : 16, orange);
  const tagTop = heightTag('4.47', (abcX + defX) / 2, H5, C.cyan);

  // cut line with its height written near the axis
  function cutLine(h) {
    const ln = new M.DashedLine({ start: [DAX, hy(h), 0], end: [LX[5] + 0.35, hy(h), 0], color: C.amber, strokeWidth: 3 });
    const t = label(`cut = ${h}`, DAX + (P ? 0.62 : 0.6), hy(h) + (P ? 0.25 : 0.22), P ? 19 : 16, C.amber, true, true);
    return new M.VGroup(ln, t);
  }
  function groupPills(groups) {
    const g = groups.map(([ids, color]) => {
      const xs = ids.map(i => LX[i]);
      const p = pill(ids.map(i => names[i]).join(''), color, P ? 18 : 16);
      return p.moveTo([(Math.min(...xs) + Math.max(...xs)) / 2, DB - (P ? 0.82 : 0.72), 0]);
    });
    return new M.VGroup(...g);
  }

  // ---------- intro signs ----------
  const signs = data.map((_, i) => {
    const x = P ? (i % 3 - 1) * 2.4 : (i % 3 - 1) * 1.5 - 4.1;
    const y = P ? (i < 3 ? -0.9 : -3.9) : (i < 3 ? 0.2 : -1.6);
    const s = P ? 1.0 : 0.75;
    const card = new M.RoundedRectangle({ width: 1.8 * s, height: 1.6 * s, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2 });
    card.setFill(C.card, 0.95);
    card.moveTo([x, y, 0]);
    const wheelY = y - 0.12 * s;
    const w1 = new M.Circle({ radius: 0.2 * s, color: C.cyan, strokeWidth: 2 }).moveTo([x - 0.38 * s, wheelY, 0]);
    const w2 = new M.Circle({ radius: 0.2 * s, color: C.cyan, strokeWidth: 2 }).moveTo([x + 0.38 * s, wheelY, 0]);
    const bar = line([x - 0.38 * s, wheelY, 0], [x + 0.05 * s, wheelY + 0.3 * s, 0], C.cyan);
    const bar2 = line([x + 0.05 * s, wheelY + 0.3 * s, 0], [x + 0.38 * s, wheelY, 0], C.cyan);
    const name = label(`Station ${names[i]}`, x, y - 0.55 * s, P ? 21 : 17, C.ink, false);
    return new M.VGroup(card, w1, w2, bar, bar2, name);
  });

  // ================= beats =================
  await until(S(0));
  await play(new M.LaggedStart(signs.map(s => fadeIn(s)), { lagRatio: 0.12, runTime: 1 }),
    ...say('SIX BICYCLE STATIONS'), ...fbox(['How many groups?', ['Not known yet', C.amber]]));
  await until(S(1));
  await play(...say('MANY GROUPINGS, ONE RUN?', C.amber), ...fbox(['Explore several groupings', 'without starting over']));
  await until(S(2));
  await play(...signs.map(s => fadeOut(s)), ...clearBox(), fadeIn(axes),
    new M.LaggedStart(dots.map(d => fadeIn(d)), { lagRatio: 0.15, runTime: 1 }), ...say('SIX STATION DOTS'));
  await until(S(3));
  await play(...say('NO GROUP CENTRES THIS TIME'), ...fbox(['No centres on the grid']));
  const rings = data.map((_, i) => new M.Circle({ radius: P ? 0.36 : 0.28, color: C.cyan, strokeWidth: 2 }).moveTo(pos(i)));
  await until(S(4));
  await play(new M.LaggedStart(rings.map(r => create(r, 0.4)), { lagRatio: 0.12, runTime: 1 }),
    ...say('EVERY STATION IS ITS OWN GROUP'));
  await until(S(5));
  await play(...fbox(['6 stations', ['6 groups to start', C.cyan]]));

  // 6-11: the idea of joining, shown with dashed bridges
  await until(S(6));
  await play(...rings.map(r => fadeOut(r)), ...showTemp(seg(0, 1, C.amber, true)),
    ...say('JOIN THE TWO CLOSEST GROUPS', C.amber), ...fbox(['Join the closest pair', 'with a bridge'], C.amber));
  await until(S(7));
  await play(...showTemp(seg(3, 4, C.amber, true)), ...say('THEN THE NEXT CLOSEST', C.amber));
  await until(S(8));
  await play(...showTemp(seg(1, 2, C.amber, true), seg(4, 5, C.amber, true), seg(2, 3, C.amber, true)),
    ...say('UNTIL ALL ARE ONE GROUP', C.amber), ...fbox(['Keep joining', 'until 1 group is left'], C.amber));
  await until(S(9));
  await play(...say('EACH JOIN IS A MERGE'), ...fbox(['Merge =', 'joining two groups']));
  await until(S(10));
  await play(...say('HIERARCHICAL CLUSTERING', C.green),
    ...fbox(['Hierarchical clustering:', 'build larger groups', 'from smaller groups'], C.green));
  await until(S(11));
  await play(...fbox(['Hierarchical =', 'small groups sit inside', 'larger groups'], C.green));

  // 12-14: distance between two groups = closest pair (single linkage)
  const outlineGroup = (ids, color) => {
    const ps = ids.map(i => pos(i));
    const xs = ps.map(p => p[0]), ys = ps.map(p => p[1]), pad = P ? 0.42 : 0.32;
    const w = Math.max(...xs) - Math.min(...xs) + 2 * pad, h = Math.max(...ys) - Math.min(...ys) + 2 * pad;
    return new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.2, color, strokeWidth: 2 })
      .moveTo([(Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2, 0]);
  };
  await until(S(12));
  await play(...clearTemp(), ...showTemp(outlineGroup([0, 1, 2], blue), outlineGroup([3, 4], orange)),
    ...say('DISTANCE BETWEEN TWO GROUPS?', C.amber), ...fbox(['A group has several stations.', ['Which distance do we use?', C.amber]]));
  await until(S(13));
  await play(...showTemp(seg(2, 3, C.amber)), ...say('USE THE CLOSEST PAIR', C.amber),
    ...fbox(['Closest pair: C and D', 'Measure that straight line'], C.amber));
  await until(S(14));
  await play(...say('SINGLE LINKAGE', C.green), ...fbox(['Single linkage:', ['group distance =', C.green], ['closest pair distance', C.green]], C.green));

  // 15-19: round one
  await until(S(15));
  await play(...clearTemp(), ...say('ROUND 1 · COMPARE ALL STATIONS'), ...fbox(['Six separate groups', 'Compare every pair']));
  await until(S(16));
  await play(...showTemp(seg(0, 1, C.amber, true)), ...fbox(['A to B ≈ 1.41'], C.amber));
  await until(S(17));
  await play(...showTemp(seg(1, 2, C.amber, true), seg(3, 4, C.amber, true)),
    ...fbox(['A to B ≈ 1.41', 'B to C ≈ 1.41', 'D to E ≈ 1.41'], C.amber));
  await until(S(18));
  await play(...say('A TIE: FIRST IN THE ALPHABET', C.amber),
    ...fbox(['Equal distances:', 'choose the first pair', ['A and B', C.amber]], C.amber));
  await until(S(19));
  await play(...clearTemp(), addLink(0, 1, blue), ...recolor(0, blue), ...recolor(1, blue),
    ...say('MERGE 1 · A + B', blue), ...fbox([['AB · C · D · E · F', blue], '5 groups left'], blue));

  // 20: switch to grid + tree
  await until(S(20));
  {
    const anims = [...clearBox()];
    if (P) {
      const old = [axes, ...dots, ...Object.values(links).map(l => l.obj)];
      lay = SMALL;
      axes = makeAxes(lay);
      dots = data.map((_, i) => makeDot(i, cols[i]));
      Object.values(links).forEach(l => { l.obj = seg(l.a, l.b, l.color); });
      anims.push(...old.map(m => fadeOut(m)), fadeIn(axes), ...dots.map(d => fadeIn(d)),
        ...Object.values(links).map(l => fadeIn(l.obj)));
      PILL = [0, 2.35, 0];
      BOXP = [0, 3.6, 0];
    } else {
      PILL = [-4.1, 1.75, 0];
      BOXP = [3.6, 1.3, 0];
    }
    anims.push(fadeIn(treeAxes), ...say('A NEW PICTURE: A TREE'));
    await play(...anims);
  }
  await until(S(21));
  await play(create(brAB, 0.8), ...fbox([['A + B join at 1.41', blue]], blue));
  await until(S(22));
  await play(new M.Indicate(brAB, { color: blue, runTime: 0.8 }), ...say('HEIGHT = JOINING DISTANCE'),
    ...fbox(['Height of the join =', 'distance when they joined']));

  // 23-27: round two
  await until(S(23));
  await play(...say('ROUND 2'), ...fbox(['Compare AB with', 'C, D, E and F']));
  await until(S(24));
  await play(...showTemp(seg(1, 2, C.amber, true)), ...fbox(['B to C ≈ 1.41'], C.amber));
  await until(S(25));
  await play(...fbox(['Shortest group distance:', ['AB to C ≈ 1.41', C.amber]], C.amber));
  await until(S(26));
  await play(...clearTemp(), addLink(1, 2, blue), ...recolor(2, blue),
    ...say('MERGE 2 · AB + C', blue), ...fbox([['ABC · D · E · F', blue], '4 groups left'], blue));
  await until(S(27));
  await play(create(brC, 0.7), ...fbox([['C joins at the same height', blue], ['1.41', blue]], blue));

  // 28-30: round three
  await until(S(28));
  await play(...showTemp(seg(3, 4, C.amber, true)), ...say('ROUND 3'), ...fbox(['D to E ≈ 1.41', 'closest remaining pair'], C.amber));
  await until(S(29));
  await play(...clearTemp(), addLink(3, 4, orange), ...recolor(3, orange), ...recolor(4, orange),
    create(brDE, 0.8), ...say('MERGE 3 · D + E', orange), ...fbox([['D + E join at 1.41', orange]], orange));
  await until(S(30));
  await play(...recolor(5, purple), ...say('THREE GROUPS'),
    ...fbox([['ABC', blue], ['DE', orange], ['F alone', purple]]));

  // 31-34: round four
  await until(S(31));
  await play(...showTemp(seg(4, 5, C.amber, true)), ...say('ROUND 4'), ...fbox(['Closest connection:', ['E to F', C.amber]], C.amber));
  await until(S(32));
  await play(...fbox(['E to F ≈ 4.12'], C.amber));
  await until(S(33));
  await play(...clearTemp(), addLink(4, 5, orange), ...recolor(5, orange),
    ...say('MERGE 4 · DE + F', orange), ...fbox([['ABC · DEF', orange], '2 groups left'], orange));
  await until(S(34));
  await play(create(brDEF, 0.8), fadeIn(tagDEF), ...fbox([['DE + F join higher, at 4.12', orange]], orange));

  // 35-37: round five
  await until(S(35));
  await play(...showTemp(seg(2, 3, C.amber, true)), ...say('ROUND 5'), ...fbox(['Closest connection:', ['C to D', C.amber]], C.amber));
  await until(S(36));
  await play(...fbox(['C to D ≈ 4.47'], C.amber));
  await until(S(37));
  await play(...clearTemp(), addLink(2, 3, C.cyan), create(brTop, 0.8), fadeIn(tagTop),
    ...say('MERGE 5 · ONE GROUP'), ...fbox(['ABC + DEF join at 4.47', 'The tree is complete']));

  // 38-40: name and rule
  await until(S(38));
  await play(...say('DENDROGRAM', C.green), ...fbox(['Dendrogram =', 'tree of the joining steps'], C.green));
  await until(S(39));
  await play(...say('THE RULE: SINGLE LINKAGE', C.green),
    ...fbox(['group distance =', 'smallest distance between', 'stations in different groups'], C.green));
  await until(S(40));
  await play(...fbox(['Every round: merge the two', 'groups with the smallest', 'group distance']));

  // 41-48: cutting the tree
  let cut = cutLine(3);
  await until(S(41));
  await play(create(cut, 0.8), ...say('CUT THE TREE', C.amber), ...fbox(['Draw a level cutting line'], C.amber));
  let dimDEF = def(orange, true), dimTop = top(C.cyan, true);
  await until(S(42));
  await play(fadeOut(brDEF), fadeOut(tagDEF), fadeOut(brTop), fadeOut(tagTop), fadeIn(dimDEF), fadeIn(dimTop),
    ...dropLink(4, 5), ...dropLink(2, 3),
    ...fbox(['Cut at height 3:', 'ignore joins above the line'], C.amber));
  let pills = groupPills([[[0, 1, 2], blue], [[3, 4], orange], [[5], purple]]);
  await until(S(43));
  await play(fadeIn(pills), ...recolor(5, purple), ...say('BELOW THE CUT: ABC · DE · F'),
    ...fbox([['ABC', blue], ['DE', orange], ['F alone', purple]]));
  await until(S(44));
  await play(...say('THREE GROUPS, NO NEW RUN', C.green), ...fbox(['3 groups from the same tree', 'without running again'], C.green));
  await until(S(45));
  {
    const next = cutLine(4.3);
    const restored = def(orange, false);
    await play(new M.Transform(cut, next, { runTime: 0.9 }), fadeOut(dimDEF), fadeIn(restored), fadeIn(tagDEF),
      ...say('RAISE THE CUT TO 4.3', C.amber), ...fbox(['Cut at height 4.3'], C.amber));
    brDEF = restored;
  }
  await until(S(46));
  {
    const two = groupPills([[[0, 1, 2], blue], [[3, 4, 5], orange]]);
    await play(fadeOut(pills), fadeIn(two), ...recolor(5, orange), addLink(4, 5, orange),
      ...say('F JOINS D AND E', orange), ...fbox([['ABC', blue], ['DEF', orange], '2 groups'], orange));
    pills = two;
  }
  await until(S(47));
  await play(...say('HIGHER CUT · FEWER, LARGER GROUPS'), ...fbox(['Higher line:', 'more joins below it', 'fewer, larger groups']));
  await until(S(48));
  {
    const back = cutLine(3);
    const three = groupPills([[[0, 1, 2], blue], [[3, 4], orange], [[5], purple]]);
    dimDEF = def(orange, true);
    await play(new M.Transform(cut, back, { runTime: 0.9 }), fadeOut(brDEF), fadeOut(tagDEF), fadeIn(dimDEF),
      fadeOut(pills), fadeIn(three), ...recolor(5, purple), ...dropLink(4, 5),
      ...say('LOWER CUT · MORE, SMALLER GROUPS'), ...fbox(['Lower line:', 'fewer joins below it', 'more, smaller groups']));
    pills = three;
  }

  // 49-53: use, traps, recap
  await until(S(49));
  await play(...say('WHAT IT IS FOR', C.green), ...fbox(['Explore how small groups', 'fit inside larger ones'], C.green));
  await until(S(50));
  await play(...say('CAREFUL: NO UNDO', C.amber), ...fbox(['Once two groups merge,', 'they stay together', 'in the same run'], C.amber));
  await until(S(51));
  await play(...showTemp(seg(0, 5, C.pink, true)), ...say('CHAINS CAN JOIN FAR STATIONS', C.pink),
    ...fbox(['Joined through close neighbours,', ['but A to F ≈ 9.43', C.pink]], C.pink));
  await until(S(52));
  await play(...clearTemp(), ...say('NEXT: OTHER GROUP DISTANCES'), ...fbox(['Next lesson: other rules', 'for group distance']));
  await until(S(53));
  await play(...say('BUILD A TREE · CHOOSE WHERE TO CUT', C.green),
    ...fbox(['Join nearby groups into a tree.', 'Cut the tree to choose groups.'], C.green));
}

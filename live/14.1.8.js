// 14.1.8 DBSCAN: finding groups in crowded areas.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// One station grid for the whole lesson. Neighbourhood circles are drawn only inside the grid area,
// so a big circle never crosses the axis names or the boxes.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const data = [[1, 1], [2, 2], [3, 3], [7, 1], [8, 2], [9, 6]];
  const names = 'ABCDEF';
  const blue = '#60a5fa', orange = '#fb923c', grey = '#8b93a8';

  const fadeIn = (m, runTime = 0.4) => new M.FadeIn(m, { runTime });
  const fadeOut = (m, runTime = 0.3) => new M.FadeOut(m, { runTime });
  const create = (m, runTime = 0.6) => new M.Create(m, { runTime });
  const line = (start, end, color = C.muted, strokeWidth = 2) => new M.Line({ start, end, color, strokeWidth });
  const label = (s, x, y, size, color = C.ink, mono = true, bold = false) =>
    T(s, size, color, mono, bold).moveTo([x, y, 0]);

  const lay = P ? { x0: -3.4, y0: -4.6, u: 0.68 } : { x0: -6.6, y0: -3.0, u: 0.5 };
  const q = (x, y) => [lay.x0 + x * lay.u, lay.y0 + y * lay.u, 0];
  const pos = i => q(data[i][0], data[i][1]);
  const PILL = P ? [0, 2.3, 0] : [-4.1, 1.75, 0];
  const BOXP = P ? [0, 3.55, 0] : [3.6, -0.3, 0];
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

  // ---------- grid and dots ----------
  const gridParts = [];
  {
    const num = P ? 20 : 15;
    for (let x = 0; x <= 10; x++) {
      gridParts.push(line(q(x, 0), q(x, 7), x ? C.grid : C.muted, x ? 1 : 2));
      if (x % 2 === 0) gridParts.push(label(String(x), q(x, 0)[0], lay.y0 - (P ? 0.27 : 0.22), num, C.muted));
    }
    for (let y = 0; y <= 7; y++) {
      gridParts.push(line(q(0, y), q(10, y), y ? C.grid : C.muted, y ? 1 : 2));
      if (y > 0 && y % 2 === 0) gridParts.push(label(String(y), lay.x0 - (P ? 0.27 : 0.22), q(0, y)[1], num, C.muted));
    }
    gridParts.push(label('Departures per hour →', lay.x0 + 5 * lay.u, lay.y0 - (P ? 0.62 : 0.55), P ? 20 : 17, C.ink, false));
    gridParts.push(label('↑ Returns per hour', lay.x0 + 1.5, lay.y0 + 7 * lay.u + 0.25, P ? 20 : 17, C.ink, false));
  }
  const grid = new M.VGroup(...gridParts);
  // letters placed so that no neighbourhood circle used below runs through them
  const offsets = [[-0.24, -0.22], [-0.25, -0.22], [-0.3, 0], [0, -0.28], [-0.25, -0.2], [0.26, 0.2]];
  function makeDot(i, color) {
    const p = pos(i);
    const halo = new M.Dot({ point: p, radius: 0.17, color });
    halo.setFill(color, 0.2);
    const dot = new M.Dot({ point: p, radius: 0.08, color });
    dot.setFill(color, 1);
    const t = label(names[i], p[0] + offsets[i][0], p[1] + offsets[i][1], P ? 22 : 18, C.ink, true, true);
    return new M.VGroup(halo, dot, t);
  }
  const cols = data.map(() => C.ink);
  const dots = data.map((_, i) => makeDot(i, C.ink));
  function recolor(i, color) {
    if (cols[i] === color) return [];
    cols[i] = color;
    return [new M.Transform(dots[i], makeDot(i, color), { runTime: 0.5 })];
  }
  function seg(a, b, color, isDashed = false) {
    const pa = pos(a), pb = pos(b);
    const d = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
    const ux = (pb[0] - pa[0]) / d, uy = (pb[1] - pa[1]) / d, r = 0.15;
    const s = [pa[0] + ux * r, pa[1] + uy * r, 0], e = [pb[0] - ux * r, pb[1] - uy * r, 0];
    return isDashed ? new M.DashedLine({ start: s, end: e, color, strokeWidth: 2.5 }) : line(s, e, color, 3.5);
  }
  // neighbourhood circle, kept inside the grid area (0..10 across, 0..7 up)
  function hood(i, r, color = C.cyan) {
    const [cx, cy] = data[i];
    const pts = [];
    for (let k = 0; k <= 180; k++) {
      const t = 2 * Math.PI * k / 180;
      pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
    }
    const inside = ([x, y]) => x >= 0 && x <= 10 && y >= 0 && y <= 7;
    const parts = [];
    for (let k = 0; k < 180; k++) {
      if (inside(pts[k]) && inside(pts[k + 1])) parts.push(line(q(...pts[k]), q(...pts[k + 1]), color, 3));
    }
    return new M.VGroup(...parts);
  }
  let circle = null;
  function moveHood(i, r, color = C.cyan) {
    const next = hood(i, r, color);
    const a = circle ? [fadeOut(circle, 0.25), create(next, 0.6)] : [create(next, 0.6)];
    circle = next;
    return a;
  }
  const dropHood = () => { const a = circle ? [fadeOut(circle)] : []; circle = null; return a; };
  let temp = [];
  const clearTemp = () => { const a = temp.map(m => fadeOut(m)); temp = []; return a; };
  function showTemp(...objs) { temp.push(...objs); return objs.map(o => create(o, 0.5)); }
  const outline = (ids, color) => {
    const ps = ids.map(pos);
    const xs = ps.map(p => p[0]), ys = ps.map(p => p[1]), pad = P ? 0.45 : 0.34;
    return new M.RoundedRectangle({ width: Math.max(...xs) - Math.min(...xs) + 2 * pad,
      height: Math.max(...ys) - Math.min(...ys) + 2 * pad, cornerRadius: 0.2, color, strokeWidth: 2 })
      .moveTo([(Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2, 0]);
  };

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
  await play(new M.LaggedStart(signs.map(s => fadeIn(s)), { lagRatio: 0.12, runTime: 1 }),
    ...say('SIX BICYCLE STATIONS'), ...fbox(['Find stations with', 'similar activity']));
  await until(S(1));
  await play(...say('SOME STATIONS FIT NO GROUP?', C.amber), ...fbox(['Some stations may not', 'belong to any group'], C.amber));
  await until(S(2));
  await play(...signs.map(s => fadeOut(s)), ...clearBox(), fadeIn(grid),
    new M.LaggedStart(dots.map(d => fadeIn(d)), { lagRatio: 0.15, runTime: 1 }), ...say('SIX STATION DOTS'));
  await until(S(3));
  await play(...showTemp(outline([0, 1, 2], C.cyan)), ...say('A, B, C: A SMALL GATHERING'));
  await until(S(4));
  await play(...showTemp(outline([3, 4], C.cyan)), new M.Indicate(dots[5], { color: C.amber, runTime: 0.9 }),
    ...say('D, E TOGETHER · F FARTHER AWAY'));
  await until(S(5));
  await play(...clearTemp(), ...say('LOOK FOR CROWDED AREAS'), ...fbox(['No group centres.', 'Search for crowded areas.']));
  await until(S(6));
  await play(...fbox(['Groups grow where', 'enough dots are close']));
  await until(S(7));
  await play(...fbox(['Crowded = many dots', 'in a small space']));
  await until(S(8));
  await play(...say('DENSITY', C.green), ...fbox([['Density =', C.green], 'how many dots', 'in a given space'], C.green));
  await until(S(9));
  await play(...say('DBSCAN', C.green), ...fbox([['DBSCAN:', C.green], 'finds groups by looking', 'for crowded areas'], C.green));

  // 10-17: the first neighbourhood
  await until(S(10));
  await play(...moveHood(0, 1.5), ...say('A CIRCLE AROUND A'), ...clearBox());
  const radius = new M.VGroup(line(pos(0), q(2.5, 1), C.amber, 3),
    label('1.5', q(1.75, 0.62)[0], q(1.75, 0.62)[1], P ? 20 : 16, C.amber, true, true));
  await until(S(11));
  await play(...showTemp(radius), ...say('RADIUS = CENTRE TO EDGE', C.amber), ...fbox(['Radius = distance from', 'centre to edge', ['radius = 1.5', C.amber]], C.amber));
  await until(S(12));
  await play(...clearTemp(), ...say("A'S NEIGHBOURHOOD"), ...fbox(['Neighbourhood = stations', 'inside or on the circle', '(A counts too)']));
  await until(S(13));
  await play(...say('RULE: AT LEAST 2 STATIONS', C.amber), ...fbox(['A group can grow only if', ['a circle holds 2 or more', C.amber]], C.amber));
  await until(S(14));
  await play(new M.Indicate(dots[1], { color: C.cyan, runTime: 0.8 }), ...fbox(["A's circle: A, B", ['count = 2', C.cyan]]));
  await until(S(15));
  await play(...recolor(0, blue), ...say('A STARTS THE BLUE GROUP', blue), ...fbox(['2 is enough', ['A is blue', blue]], blue));
  await until(S(16));
  await play(...say('CORE STATION', C.green), ...fbox([['Core station =', C.green], 'enough neighbours', 'to grow a group'], C.green));
  await until(S(17));
  await play(...recolor(1, blue), ...say('STEP 1 · A BRINGS IN B', blue), ...fbox([['Blue: A, B', blue]], blue));

  // 18-25: growing through B and C
  await until(S(18));
  await play(...moveHood(1, 1.5), ...say('STEP 2 · CIRCLE AT B'));
  await until(S(19));
  await play(...fbox(["B's circle: A, B, C", ['count = 3', C.cyan]]));
  await until(S(20));
  await play(...recolor(2, blue), ...fbox(['B is a core station', ['C joins blue', blue]], blue));
  await until(S(21));
  await play(...moveHood(2, 1.5), ...say('STEP 3 · CIRCLE AT C'));
  await until(S(22));
  await play(...fbox(["C's circle: B, C", 'both are blue already']));
  await until(S(23));
  await play(...say('BLUE GROUP IS FINISHED', blue), ...fbox(['No new stations', ['Blue: A, B, C', blue]], blue));
  await until(S(24));
  await play(...dropHood(), ...showTemp(seg(0, 2, C.pink, true)),
    ...fbox([['A to C ≈ 2.83', C.pink], 'more than the radius 1.5'], C.pink));
  await until(S(25));
  await play(...clearTemp(), ...showTemp(seg(0, 1, C.green), seg(1, 2, C.green)), ...say('LINKED THROUGH B', C.green),
    ...fbox(['A to B ≈ 1.41', 'B to C ≈ 1.41', ['two short steps', C.green]], C.green));

  // 26-34: orange group and noise
  await until(S(26));
  await play(...clearTemp(), ...moveHood(3, 1.5), ...say('CIRCLE AT D'), ...fbox(["D's circle: D, E", ['count = 2', C.cyan]]));
  await until(S(27));
  await play(...recolor(3, orange), ...recolor(4, orange), ...say('A SECOND GROUP: ORANGE', orange),
    ...fbox(['2 is enough', ['Orange: D, E', orange]], orange));
  await until(S(28));
  await play(...moveHood(4, 1.5), ...say('ORANGE GROUP IS FINISHED', orange), ...fbox(["E's circle: D, E", 'nothing new']));
  await until(S(29));
  await play(...moveHood(5, 1.5), ...say('CIRCLE AT F'), ...clearBox());
  await until(S(30));
  await play(...fbox(["F's circle: only F", ['count = 1', C.amber]], C.amber));
  await until(S(31));
  await play(...fbox(['1 is less than 2', 'F cannot start a group', 'and no group reached F'], C.amber));
  await until(S(32));
  await play(...recolor(5, grey), ...say('F STAYS GREY', grey));
  await until(S(33));
  await play(...dropHood(), ...say('NOISE', C.green), ...fbox([['Noise =', C.green], 'stations outside', 'every group'], C.green));
  await until(S(34));
  await play(...fbox(["F's numbers are fine:", 'its activity is just', 'different']));

  // 35-45: bigger radius, three stations required
  await until(S(35));
  await play(...say('CHANGE THE TWO RULES', C.amber), ...clearBox());
  await until(S(36));
  await play(...fbox([['Radius = 4.2', C.amber], ['At least 3 stations', C.amber]], C.amber));
  await until(S(37));
  await play(...data.flatMap((_, i) => recolor(i, C.ink)), ...say('CLEAR THE COLOURS'));
  await until(S(38));
  await play(...moveHood(0, 4.2), ...fbox(["A's circle: A, B, C → 3", ['core', blue]]));
  await until(S(38) + 1.4);
  await play(...moveHood(1, 4.2), ...fbox(["B's circle: A, B, C → 3", ['core', blue]]));
  await until(S(38) + 2.8);
  await play(...moveHood(2, 4.2), ...[0, 1, 2].flatMap(i => recolor(i, blue)), ...say('A, B, C ARE CORE STATIONS', blue),
    ...fbox(["C's circle: A, B, C → 3", ['A, B, C: all core', blue]], blue));
  await until(S(39));
  await play(...moveHood(3, 4.2), ...say('D: NOT A CORE STATION', C.amber), ...fbox(["D's circle: D, E → 2", ['2 < 3: not core', C.amber]], C.amber));
  await until(S(40));
  await play(...moveHood(4, 4.2), ...recolor(4, orange), ...say('E IS A CORE STATION', orange),
    ...fbox(["E's circle: D, E, F → 3", ['core', orange]], orange));
  await until(S(41));
  await play(...moveHood(5, 4.2), ...say('F: NOT A CORE STATION', C.amber), ...fbox(["F's circle: E, F → 2", ['2 < 3: not core', C.amber]], C.amber));
  await until(S(42));
  await play(...moveHood(4, 4.2, orange), ...recolor(3, orange), ...recolor(5, orange), ...say('E BRINGS IN D AND F', orange),
    ...fbox(['D and F are inside', ["E's circle → orange", orange]], orange));
  await until(S(43));
  await play(...say('BORDER STATION', C.green), ...fbox([['Border station =', C.green], 'reached by a core station,', 'too few neighbours itself'], C.green));
  await until(S(44));
  await play(new M.Indicate(dots[3], { color: orange }), new M.Indicate(dots[5], { color: orange }),
    ...fbox([['D and F: border stations', orange], 'no stations outside'], orange));
  await until(S(45));
  await play(...dropHood(), ...say('TWO GROUPS: ABC AND DEF'), ...fbox([['ABC', blue], ['DEF', orange]]));

  // 46-53: rule, uses, traps, recap
  await until(S(46));
  await play(...say('THE CORE STATION RULE'), ...clearBox());
  await until(S(47));
  await play(...fbox(['core station when', ['neighbourhood count', C.green], ['≥ required count', C.green]], C.green));
  await until(S(48));
  await play(...fbox(['Grow through core stations,', 'add the border stations', 'they reach']));
  await until(S(49));
  await play(...say('WHAT IT IS FOR', C.green), ...fbox(['Finds connected groups', 'without choosing how many', 'groups first'], C.green));
  await until(S(50));
  await play(...say('IT SHOWS UNUSUAL STATIONS', C.green), ...fbox(['Noise stations, like F', 'in the first example,', 'deserve a closer look'], C.green));
  await until(S(51));
  await play(...moveHood(0, 1.2, C.amber), ...say('CAREFUL: CIRCLE TOO SMALL', C.amber),
    ...fbox(['Too small: no circle holds', 'enough stations, groups', 'stay hidden'], C.amber));
  await until(S(52));
  await play(...moveHood(2, 6, C.pink), ...say('CAREFUL: CIRCLE TOO LARGE', C.pink),
    ...fbox(['Too large: groups you', 'wanted apart can join'], C.pink));
  await until(S(53));
  await play(...dropHood(), ...say('GROW THROUGH CROWDED AREAS', C.green),
    ...fbox(['Groups grow through', 'crowded neighbourhoods.', 'Unreached stations stay outside.'], C.green));
}

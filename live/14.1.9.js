// 14.1.9 Silhouette scores: does a station belong in its group?
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Laptop: station grid left, box and score number line right. Phone: box on top, grid in the middle,
// number line at the bottom.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const data = [[1, 1], [2, 2], [3, 3], [7, 1], [8, 2], [9, 6]];
  const names = 'ABCDEF';
  const blue = '#60a5fa', orange = '#fb923c';

  const fadeIn = (m, runTime = 0.4) => new M.FadeIn(m, { runTime });
  const fadeOut = (m, runTime = 0.3) => new M.FadeOut(m, { runTime });
  const create = (m, runTime = 0.6) => new M.Create(m, { runTime });
  const line = (start, end, color = C.muted, strokeWidth = 2) => new M.Line({ start, end, color, strokeWidth });
  const label = (s, x, y, size, color = C.ink, mono = true, bold = false) =>
    T(s, size, color, mono, bold).moveTo([x, y, 0]);

  const lay = P ? { x0: -3.4, y0: -4.2, u: 0.68 } : { x0: -6.6, y0: -3.0, u: 0.5 };
  const q = (x, y) => [lay.x0 + x * lay.u, lay.y0 + y * lay.u, 0];
  const pos = i => q(data[i][0], data[i][1]);
  const PILL = P ? [0, 2.3, 0] : [-4.1, 1.75, 0];
  const BOXP = P ? [0, 3.55, 0] : [3.7, 0.45, 0];
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
    const maxW = P ? FW - 0.8 : 5.4;
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
    gridParts.push(label('Departures per hour →', lay.x0 + 5 * lay.u, lay.y0 - (P ? 0.6 : 0.55), P ? 20 : 17, C.ink, false));
    gridParts.push(label('↑ Returns per hour', lay.x0 + 1.5, lay.y0 + 7 * lay.u + 0.25, P ? 20 : 17, C.ink, false));
  }
  const grid = new M.VGroup(...gridParts);
  // B's letter sits outside the amber ring drawn around B
  const offsets = [[-0.24, 0.22], [-0.46, 0.3], [-0.24, 0.22], [-0.22, -0.24], [0.26, -0.2], [0.26, 0.2]];
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
  function seg(a, b, color) {
    const pa = pos(a), pb = pos(b);
    const d = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
    const ux = (pb[0] - pa[0]) / d, uy = (pb[1] - pa[1]) / d, r = 0.15;
    return line([pa[0] + ux * r, pa[1] + uy * r, 0], [pb[0] - ux * r, pb[1] - uy * r, 0], color, 3);
  }
  let temp = [];
  const clearTemp = () => { const a = temp.map(m => fadeOut(m)); temp = []; return a; };
  function showTemp(...objs) { temp.push(...objs); return objs.map(o => create(o, 0.5)); }

  // ---------- score number line ----------
  const NL = P ? { cx: 0, half: 3.4, y: -6.15 } : { cx: 3.7, half: 2.5, y: -2.55 };
  const nx = v => NL.cx + v * NL.half;
  const numberLine = new M.VGroup(
    line([nx(-1), NL.y, 0], [nx(1), NL.y, 0], C.ink, 2.5),
    ...[-1, -0.5, 0, 0.5, 1].flatMap(v => [
      line([nx(v), NL.y - 0.08, 0], [nx(v), NL.y + 0.08, 0], C.ink, 2),
      label(v === 0 ? '0' : (v > 0 ? `+${v}` : `−${-v}`), nx(v), NL.y - (P ? 0.32 : 0.28), P ? 19 : 16, C.muted)]),
    label('Silhouette score', NL.cx, NL.y + (P ? 0.68 : 0.62), P ? 20 : 17, C.ink, false));
  function marker(v, text, color) {
    const d = new M.Dot({ point: [nx(v), NL.y, 0], radius: 0.11, color });
    d.setFill(color, 1);
    return new M.VGroup(d, label(text, nx(v), NL.y + (P ? 0.32 : 0.28), P ? 19 : 16, color, true, true));
  }

  // ---------- intro signs ----------
  const signs = data.map((_, i) => {
    const x = P ? (i % 3 - 1) * 2.4 : (i % 3 - 1) * 1.5 - 4.1;
    const y = P ? (i < 3 ? -0.9 : -3.9) : (i < 3 ? 0.2 : -1.6);
    const s = P ? 1.0 : 0.75;
    const color = i < 3 ? blue : orange;
    const card = new M.RoundedRectangle({ width: 1.8 * s, height: 1.6 * s, cornerRadius: 0.16, color, strokeWidth: 2 });
    card.setFill(C.card, 0.95);
    card.moveTo([x, y, 0]);
    const wy = y - 0.12 * s;
    const w1 = new M.Circle({ radius: 0.2 * s, color, strokeWidth: 2 }).moveTo([x - 0.38 * s, wy, 0]);
    const w2 = new M.Circle({ radius: 0.2 * s, color, strokeWidth: 2 }).moveTo([x + 0.38 * s, wy, 0]);
    const b1 = line([x - 0.38 * s, wy, 0], [x + 0.05 * s, wy + 0.3 * s, 0], color);
    const b2 = line([x + 0.05 * s, wy + 0.3 * s, 0], [x + 0.38 * s, wy, 0], color);
    return new M.VGroup(card, w1, w2, b1, b2, label(`Station ${names[i]}`, x, y - 0.55 * s, P ? 21 : 17, C.ink, false));
  });

  // ================= beats =================
  await until(S(0));
  await play(new M.LaggedStart(signs.map(s => fadeIn(s)), { lagRatio: 0.12, runTime: 1 }),
    ...say('SIX STATIONS · TWO GROUPS'), ...fbox([['Blue group: A, B, C', blue], ['Orange group: D, E, F', orange]]));
  await until(S(1));
  await play(...say('DO THE GROUPS MAKE SENSE?', C.amber), ...fbox(['Check the groups', 'before you use them'], C.amber));
  await until(S(2));
  await play(...signs.map(s => fadeOut(s)), ...clearBox(), fadeIn(grid),
    new M.LaggedStart(dots.map(d => fadeIn(d)), { lagRatio: 0.15, runTime: 1 }), ...say('SIX STATION DOTS'));
  await until(S(3));
  await play(...[0, 1, 2].flatMap(i => recolor(i, blue)), ...[3, 4, 5].flatMap(i => recolor(i, orange)),
    ...say('BLUE: A, B, C · ORANGE: D, E, F'));
  const ringB = new M.Circle({ radius: P ? 0.34 : 0.3, color: C.amber, strokeWidth: 3 }).moveTo(pos(1));
  await until(S(4));
  await play(create(ringB), ...say('LOOK AT STATION B', C.amber));
  await until(S(5));
  await play(new M.Indicate(dots[1], { color: C.amber }), ...say('DOES B BELONG IN BLUE?', C.amber));
  await until(S(6));
  await play(...say('FRIENDS IN A PARK'), ...fbox(['You stand with', 'a group of friends']));
  await until(S(7));
  await play(...fbox([['Your friends: nearby', C.green], ['Other groups: far away', orange]]));
  await until(S(8));
  await play(...fbox(['Same idea for B:', 'near its group?', 'far from the other?']));

  // 9-17: cohesion
  await until(S(9));
  await play(...say('1 · HOW CLOSE IS B TO ITS OWN GROUP?', blue), ...clearBox());
  await until(S(10));
  await play(...showTemp(seg(1, 0, blue)), ...fbox([['B to A ≈ 1.41', blue]], blue));
  await until(S(11));
  await play(...showTemp(seg(1, 2, blue)), ...fbox([['B to A ≈ 1.41', blue], ['B to C ≈ 1.41', blue]], blue));
  await until(S(12));
  await play(...fbox(['1.41 + 1.41 ≈ 2.83'], blue));
  await until(S(13));
  await play(...fbox(['2.83 ÷ 2', '(2 other stations)'], blue));
  await until(S(14));
  await play(...fbox(['Mean distance', ['to own group ≈ 1.41', blue]], blue));
  await until(S(15));
  await play(new M.Indicate(ringB, { color: C.amber }), ...fbox(['B to B is not counted'], C.amber));
  await until(S(16));
  await play(...fbox(['How closely B sits', 'among its own group'], blue));
  await until(S(17));
  await play(...say('COHESION', C.green), ...fbox([['Cohesion =', C.green], 'closeness within a group'], C.green));

  // 18-25: separation
  await until(S(18));
  await play(...clearTemp(), ...say('2 · HOW FAR IS B FROM ORANGE?', orange), ...clearBox());
  await until(S(19));
  await play(...showTemp(seg(1, 3, orange)), ...fbox([['B to D ≈ 5.10', orange]], orange));
  await until(S(20));
  await play(...showTemp(seg(1, 4, orange)), ...fbox([['B to D ≈ 5.10', orange], ['B to E = 6', orange]], orange));
  await until(S(21));
  await play(...showTemp(seg(1, 5, orange)), ...fbox([['B to D ≈ 5.10', orange], ['B to E = 6', orange], ['B to F ≈ 8.06', orange]], orange));
  await until(S(22));
  await play(...fbox(['5.10 + 6 + 8.06', '≈ 19.16'], orange));
  await until(S(23));
  await play(...fbox(['19.16 ÷ 3', ['mean ≈ 6.39', orange]], orange));
  await until(S(24));
  await play(...fbox(['How far B sits', 'from the other group'], orange));
  await until(S(25));
  await play(...say('SEPARATION', C.green), ...fbox([['Separation =', C.green], 'distance from', 'another group'], C.green));

  // 26-35: the score for B
  await until(S(26));
  await play(...clearTemp(), ...say('SIDE BY SIDE'),
    ...fbox([['Own group    ≈ 1.41', blue], ['Other group  ≈ 6.39', orange]]));
  await until(S(27));
  await play(...say('B IS MUCH CLOSER TO ITS OWN GROUP', blue));
  await until(S(28));
  await play(...fbox(['B belongs', 'where it is'], C.green));
  await until(S(29));
  await play(...say('SILHOUETTE SCORE', C.green), ...fbox([['Silhouette score:', C.green], 'one number for', 'this comparison'], C.green));
  await until(S(30));
  await play(...fbox(['other group − own group']));
  await until(S(31));
  await play(...fbox(['6.39 − 1.41 ≈ 4.98']));
  await until(S(32));
  await play(...fbox(['Divide by the larger', 'mean distance: 6.39']));
  await until(S(33));
  await play(...fbox(['4.98 ÷ 6.39', ['≈ 0.78', C.green]], C.green));
  await until(S(34));
  await play(create(numberLine, 0.9), ...say('A NUMBER LINE: −1 TO +1'));
  const mB = marker(0.78, 'B ≈ +0.78', C.green);
  await until(S(35));
  await play(fadeIn(mB), ...fbox([['B ≈ +0.78', C.green], 'near +1: a good fit'], C.green));

  // 36-42: C in the wrong group, on purpose
  await until(S(36));
  await play(fadeOut(ringB), ...recolor(2, orange), ...say('TEST: PUT C IN ORANGE', C.pink), ...clearBox());
  await until(S(37));
  await play(...showTemp(seg(2, 3, orange), seg(2, 4, orange), seg(2, 5, orange)),
    ...fbox(['C to D, E, F', ['mean ≈ 5.43', orange]], orange));
  await until(S(38));
  await play(...clearTemp(), ...showTemp(seg(2, 0, blue), seg(2, 1, blue)), ...fbox(['C to A, B', ['mean ≈ 2.12', blue]], blue));
  await until(S(39));
  await play(...fbox(['2.12 − 5.43', ['≈ −3.31', C.pink]], C.pink));
  const mC = marker(-0.61, 'C ≈ −0.61', C.pink);
  await until(S(40));
  await play(...fbox(['−3.31 ÷ 5.43', ['≈ −0.61', C.pink]], C.pink));
  await until(S(41));
  await play(fadeIn(mC), ...say('NEGATIVE: CLOSER TO THE OTHER GROUP', C.pink),
    ...fbox(['C is closer, on average,', 'to the other group'], C.pink));
  await until(S(42));
  await play(...clearTemp(), fadeOut(mC), ...recolor(2, blue), ...say('C GOES BACK TO BLUE', blue), ...clearBox());

  // 43-53: the formula, reading scores, traps, recap
  await until(S(43));
  await play(...say('THE SHORT FORMULA', C.green));
  await until(S(44));
  await play(...fbox([['a', C.cyan], 'mean distance to the other', 'members of its own group']));
  await until(S(45));
  await play(...fbox([['b', C.cyan], 'mean distance to the', 'nearest other group']));
  await until(S(46));
  await play(...fbox(['Several other groups:', 'use the smallest', 'mean distance']));
  await until(S(47));
  await play(...fbox([['score = (b − a)', C.green], ['÷ the larger of a and b', C.green]], C.green));
  await until(S(48));
  await play(new M.Indicate(mB, { color: C.green }), ...fbox([['Near +1: good fit', C.green], ['Negative: a better', C.pink], ['group elsewhere', C.pink]]));
  const zeroMark = new M.Circle({ radius: 0.2, color: C.amber, strokeWidth: 3 }).moveTo([nx(0), NL.y, 0]);
  await until(S(49));
  await play(create(zeroMark), ...fbox(['Near 0: a and b', 'are almost equal'], C.amber));
  await until(S(50));
  await play(fadeOut(zeroMark), ...fbox(['Alone in its group:', 'score = 0', '(by convention)']));
  await until(S(51));
  await play(...say('COMPARE WHOLE GROUPINGS'), ...fbox(['Score every station,', 'then take the mean']));
  await until(S(52));
  await play(...say('CAREFUL', C.amber), ...fbox(['High score: fits the', 'distance rule, not always', 'your business needs'], C.amber));
  await until(S(53));
  await play(...say('OWN GROUP VS NEAREST OTHER GROUP', C.green),
    ...fbox(['How well a station fits its', 'own group, compared with', 'the nearest other group'], C.green));
}

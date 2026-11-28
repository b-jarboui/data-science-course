// 2.3.7 Maps and denominators: compare trips per resident (live manim-web lesson).
// Beat i = sentence i (0-based, 0..44). Runs in site/live/engine.js.
// Chapter facts (chapters/2.3.md): North 8,000 trips / 40,000 residents = 0.2; Center 6,000 / 10,000 = 0.6;
// South 5,000 / 25,000 = 0.2. Count map: North darkest. Rate map: Center darkest, North = South.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const NAMES = ['North', 'Center', 'South'];
  const TRIPS = ['8,000', '6,000', '5,000'];
  const RES = ['40,000', '10,000', '25,000'];
  const GROUPS = ['4,000', '1,000', '2,500'];
  const PERG = [2, 6, 2];
  const RATE = ['0.2', '0.6', '0.2'];
  // shades: more = darker. Dark text on the light fills, light text on the dark fill.
  const SH = { light: ['#bfdbfe', C.bg], mid: ['#60a5fa', C.bg], dark: ['#1d4ed8', C.ink], none: [C.card, C.ink] };
  const COUNT_SH = ['dark', 'mid', 'light'];
  const RATE_SH = ['light', 'dark', 'light'];

  // ---------------- layout ----------------
  const PILL = P ? [0, 2.3, 0] : [-2.45, 1.92, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.55, -0.45, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const MAPX = P ? -0.95 : -4.0, TW = P ? 4.6 : 3.8, TH = P ? 1.3 : 1.1;
  const TY = P ? [0.75, -0.7, -2.15] : [0.8, -0.4, -1.6];
  const KEYX = P ? 2.6 : -0.85, KEYY = TY[1];

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = 20, lh = P ? 0.38 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.62, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.31, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => t.moveTo([left + t.getWidth() / 2, top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.6 : 4.6;
    if (wd > maxw) { g.scale(maxw / wd); g.moveTo(BOXP); }
    const a = [new M.FadeIn(g, { runTime: 0.6 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }
  const hideBox = () => { if (!boxNow) return []; const b = boxNow; boxNow = null; return [new M.FadeOut(b, { runTime: 0.5 })]; };
  const line = (a, b, col, w = 2) => new M.Line({ start: a, end: b, color: col, strokeWidth: w });
  const txt = (s, size, col, p, mono = false, bold = false) => T(s, size, col, mono, bold).moveTo(p);
  function rider(x, y, col, sc = 1) {
    const head = new M.Circle({ radius: 0.09 * sc, color: col, strokeWidth: 1.5 }); head.setFill(col, 1); head.moveTo([x, y + 0.15 * sc, 0]);
    const body = new M.Arc({ radius: 0.15 * sc, startAngle: 0, angle: Math.PI, color: col }); body.setFill(col, 1); body.moveTo([x, y - 0.05 * sc, 0]);
    return new M.VGroup(head, body);
  }
  function token(x, y) { const r = new M.RoundedRectangle({ width: 0.3, height: 0.2, cornerRadius: 0.04, color: C.amber, strokeWidth: 1.5 }); r.setFill(C.amber, 1); r.moveTo([x, y, 0]); return r; }

  // one map tile: area shape + its words (2 or 3 lines)
  function tile(cx, cy, w, h, shade, lines, border = null) {
    const [fill, ink] = SH[shade];
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color: border || (shade === 'none' ? C.muted : fill), strokeWidth: border ? 3 : 2 });
    r.setFill(fill, shade === 'none' ? 0.95 : 1); r.moveTo([cx, cy, 0]);
    const lh = P ? 0.36 : 0.31, n = lines.length;
    const ts = lines.map(([s, size, bold], i) => txt(s, size, ink, [cx, cy + ((n - 1) / 2 - i) * lh, 0], false, bold));
    return new M.VGroup(r, ...ts);
  }
  const tiles = [null, null, null];
  function setTile(k, shade, lines, opts = {}) {
    const { x = MAPX, w = TW, h = TH, y = TY[k], arr = tiles, border = null } = opts;
    const g = tile(x, y, w, h, shade, lines, border), a = [new M.FadeIn(g, { runTime: 0.6 })];
    if (arr[k]) a.push(new M.FadeOut(arr[k], { runTime: 0.5 }));
    arr[k] = g;
    return a;
  }
  const nameL = k => [NAMES[k], P ? 20 : 19, true];
  const tripL = k => [TRIPS[k] + ' trips', P ? 20 : 19, true];
  const resL = k => [RES[k] + ' residents', P ? 17 : 16, false];

  function keyCard(title, rows, color = C.muted) {
    const w = P ? 2.0 : 2.0, h = P ? 2.7 : 2.45;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: 2 }); r.setFill(C.card, 0.95); r.moveTo([KEYX, KEYY, 0]);
    const head = txt(title, P ? 16 : 16, C.ink, [KEYX, KEYY + h / 2 - 0.3, 0], false, true);
    const items = rows.map(([shade, label], i) => {
      const y = KEYY + h / 2 - 0.8 - i * (P ? 0.6 : 0.52);
      const s = new M.RoundedRectangle({ width: 0.42, height: 0.3, cornerRadius: 0.05, color: C.muted, strokeWidth: 1 }); s.setFill(SH[shade][0], 1); s.moveTo([KEYX - 0.5, y, 0]);
      return new M.VGroup(s, txt(label, P ? 18 : 18, C.ink, [KEYX + 0.3, y, 0], true, true));
    });
    const foot = txt('darker = more', P ? 15 : 15, C.muted, [KEYX, KEYY - h / 2 + 0.25, 0]);
    return new M.VGroup(r, head, ...items, foot);
  }

  // =========================================================================
  // 0-1: the question
  // =========================================================================
  const skyY = P ? -1.8 : -1.1;
  const bspec = P ? [[-2.6, 1.0, 1.6], [-1.3, 0.9, 2.4], [0, 1.0, 1.8], [1.3, 0.9, 2.6], [2.6, 1.0, 1.4]]
    : [[-6.0, 1.2, 1.6], [-4.4, 1.1, 2.4], [-2.8, 1.2, 1.9], [-1.2, 1.1, 2.6], [0.4, 1.2, 1.5]];
  const sky = new M.VGroup(line([P ? -3.4 : -6.8, skyY, 0], [P ? 3.4 : 1.1, skyY, 0], C.muted, 3), ...bspec.flatMap(([bx, bw, bh]) => {
    const r = new M.Rectangle({ width: bw, height: bh, color: C.muted, strokeWidth: 1.6 }); r.setFill('#18214a', 0.95); r.moveTo([bx, skyY + bh / 2, 0]);
    const w = [];
    for (let wy = skyY + 0.4; wy < skyY + bh - 0.2; wy += 0.42) for (const dx of [-bw * 0.25, bw * 0.25]) { const q = new M.Rectangle({ width: 0.16, height: 0.16, color: C.amber, strokeWidth: 0.8 }); q.setFill(C.amber, 0.55); q.moveTo([bx + dx, wy, 0]); w.push(q); }
    return [r, ...w];
  }));
  await until(S(0));
  await play(new M.FadeIn(sky), ...fbox([['which areas', C.ink], ['to study first?', C.amber]], C.amber), ...say('WHICH AREAS TO STUDY FIRST?', C.amber));

  await until(S(1));
  await play(...fbox([['more trips for each', C.ink], ['person who lives', C.ink], ['there?', C.amber]], C.amber), ...say('TRIPS FOR EACH PERSON?', C.amber));

  // =========================================================================
  // 2-11: the count map
  // =========================================================================
  const compass = txt('N ↑', P ? 18 : 18, C.muted, [MAPX - TW / 2 - (P ? -0.2 : 0.45), TY[0] + TH / 2 + (P ? 0.3 : 0.0), 0], false, true);
  await until(S(2));
  await play(new M.FadeOut(sky), ...hideBox(), ...[0, 1, 2].flatMap(k => setTile(k, 'none', [])), ...say('THREE PARTS OF THE CITY'));

  await until(S(3));
  await play(...setTile(0, 'none', [nameL(0)]), new M.FadeIn(compass), ...say('NORTH AT THE TOP'));

  await until(S(4));
  await play(...setTile(1, 'none', [nameL(1)]), ...setTile(2, 'none', [nameL(2)]), ...say('CENTER IN THE MIDDLE, SOUTH AT THE BOTTOM'));

  for (const k of [0, 1, 2]) {
    await until(S(k + 5));
    await play(...setTile(k, 'none', [nameL(k), tripL(k)]), ...say(`${NAMES[k].toUpperCase()}: ${TRIPS[k]} TRIPS A DAY`));
  }

  // 8: shade by trips (more = darker)
  await until(S(8));
  await play(...[0, 1, 2].flatMap(k => setTile(k, COUNT_SH[k], [nameL(k), tripL(k)])),
    ...fbox([['more trips =', C.ink], ['darker shade', C.cyan]], C.cyan), ...say('MORE TRIPS = DARKER SHADE'));

  // 9: key beside the map
  const keyCount = keyCard('trips / day', [['light', '5,000'], ['mid', '6,000'], ['dark', '8,000']]);
  await until(S(9));
  await play(new M.FadeIn(keyCount), ...fbox([['the key: which', C.ink], ['count goes with', C.ink], ['each shade', C.cyan]], C.cyan), ...say('THE KEY: COUNT FOR EACH SHADE'));

  await until(S(10));
  await play(new M.Indicate(tiles[0], { color: C.amber, scaleFactor: 1.05 }), ...fbox([['North is darkest', C.amber], ['(most trips)', C.ink]], C.amber), ...say('NORTH IS DARKEST', C.amber));

  await until(S(11));
  await play(...fbox([['one shade per area', C.ink], ['shows a number:', C.ink], ['a choropleth', C.cyan]], C.cyan), ...say('CHOROPLETH = ONE SHADE PER AREA'));

  // =========================================================================
  // 12-16: residents
  // =========================================================================
  await until(S(12));
  await play(...fbox([['now add the', C.ink], ['residents', C.violet]], C.violet), ...say('ADD THE RESIDENTS', C.violet));

  await until(S(13));
  await play(...fbox([['resident =', C.violet], ['a person who', C.ink], ['lives there', C.ink]], C.violet), ...say('RESIDENT = A PERSON WHO LIVES THERE', C.violet));

  for (const k of [0, 1, 2]) {
    await until(S(k + 14));
    await play(...setTile(k, COUNT_SH[k], [nameL(k), tripL(k), resL(k)]), ...say(`${NAMES[k].toUpperCase()}: ${RES[k]} RESIDENTS`, C.violet));
  }

  // =========================================================================
  // 17-25: groups of ten
  // =========================================================================
  const gC = P ? [0, -1.0] : [-2.45, -0.4];
  const grpBox = new M.RoundedRectangle({ width: P ? 6.6 : 5.6, height: 1.5, cornerRadius: 0.16, color: C.violet, strokeWidth: 2.5 }); grpBox.setFill(C.card, 0.95); grpBox.moveTo([gC[0], gC[1], 0]);
  const grpPeople = Array.from({ length: 10 }, (_, i) => rider(gC[0] + (i - 4.5) * (P ? 0.6 : 0.5), gC[1] + 0.15, C.violet, 1.1));
  const grpCap = txt('1 group = 10 people', P ? 19 : 19, C.violet, [gC[0], gC[1] - 0.48, 0], false, true);
  const grpCard = new M.VGroup(grpBox, ...grpPeople, grpCap);
  await until(S(17));
  await play(new M.FadeOut(new M.VGroup(...tiles, keyCount, compass)),
    new M.FadeIn(grpCard), ...fbox([['compare with the', C.ink], ['same size group', C.violet], ['in every area', C.ink]], C.violet), ...say('THE SAME SIZE GROUP FOR EVERY AREA', C.violet));
  tiles.fill(null);

  // work table: area | groups of 10 | trips per group (+ trip tokens)
  const colX = P ? [-2.75, -0.55, 2.05] : [-5.4, -2.9, 0.0];
  const rowY = P ? [0.7, -0.85, -2.4] : [0.75, -0.45, -1.65];
  const head = new M.VGroup(txt('area', P ? 17 : 17, C.muted, [colX[0], P ? 1.6 : 1.35, 0], false, true),
    txt('groups of 10', P ? 17 : 17, C.muted, [colX[1], P ? 1.6 : 1.35, 0], false, true),
    txt('trips per group', P ? 17 : 17, C.muted, [colX[2], P ? 1.6 : 1.35, 0], false, true));
  const rowBg = [0, 1, 2].map(k => { const r = new M.RoundedRectangle({ width: P ? 7.6 : 7.9, height: P ? 1.3 : 1.0, cornerRadius: 0.14, color: C.line, strokeWidth: 1.5 }); r.setFill(C.card, 0.9); r.moveTo([P ? 0 : -2.65, rowY[k], 0]); return r; });
  const rowName = k => new M.VGroup(txt(NAMES[k], 20, C.ink, [colX[0], rowY[k] + (P ? 0.2 : 0.15), 0], false, true), txt(RES[k] + ' people', P ? 15 : 15, C.violet, [colX[0], rowY[k] - (P ? 0.25 : 0.2), 0]));
  const rowGroups = k => txt(GROUPS[k], 22, C.violet, [colX[1], rowY[k], 0], true, true);
  const rowTrips = k => {
    const n = PERG[k], tx = txt(String(n), 24, C.amber, [colX[2] - (P ? 0.9 : 1.0), rowY[k], 0], true, true);
    const tk = Array.from({ length: n }, (_, i) => token(colX[2] - (P ? 0.45 : 0.5) + (i % 3) * 0.38, rowY[k] + (n > 3 ? (i < 3 ? 0.14 : -0.14) : 0)));
    return new M.VGroup(tx, ...tk);
  };
  const W = { names: [], groups: [], trips: [] };

  // 18-19: North
  await until(S(18));
  W.names[0] = rowName(0);
  await play(new M.FadeOut(grpCard), new M.FadeIn(head), new M.FadeIn(rowBg[0]), new M.FadeIn(W.names[0]),
    ...fbox([['North: 40,000', C.ink], ['split into groups', C.ink], ['of 10', C.violet]], C.violet), ...say('NORTH: GROUPS OF 10', C.violet));
  await until(S(19));
  W.groups[0] = rowGroups(0);
  await play(new M.FadeIn(W.groups[0]), ...fbox([['40,000 ÷ 10', C.ink], ['= 4,000 groups', C.violet]], C.violet), ...say('40,000 ÷ 10 = 4,000 GROUPS', C.violet));
  await until(S(20));
  W.trips[0] = rowTrips(0);
  await play(new M.FadeIn(W.trips[0]), ...fbox([['8,000 trips', C.ink], ['÷ 4,000 groups', C.ink], ['= 2 per group', C.amber]], C.amber), ...say('8,000 ÷ 4,000 = 2 TRIPS PER GROUP', C.amber));

  // 21-22: Center
  await until(S(21));
  W.names[1] = rowName(1); W.groups[1] = rowGroups(1);
  await play(new M.FadeIn(rowBg[1]), new M.FadeIn(W.names[1]), new M.FadeIn(W.groups[1]),
    ...fbox([['10,000 ÷ 10', C.ink], ['= 1,000 groups', C.violet]], C.violet), ...say('CENTER: 1,000 GROUPS OF 10', C.violet));
  await until(S(22));
  W.trips[1] = rowTrips(1);
  await play(new M.FadeIn(W.trips[1]), ...fbox([['6,000 trips', C.ink], ['÷ 1,000 groups', C.ink], ['= 6 per group', C.amber]], C.amber), ...say('6,000 ÷ 1,000 = 6 TRIPS PER GROUP', C.amber));

  // 23-24: South
  await until(S(23));
  W.names[2] = rowName(2); W.groups[2] = rowGroups(2);
  await play(new M.FadeIn(rowBg[2]), new M.FadeIn(W.names[2]), new M.FadeIn(W.groups[2]),
    ...fbox([['25,000 ÷ 10', C.ink], ['= 2,500 groups', C.violet]], C.violet), ...say('SOUTH: 2,500 GROUPS OF 10', C.violet));
  await until(S(24));
  W.trips[2] = rowTrips(2);
  await play(new M.FadeIn(W.trips[2]), ...fbox([['5,000 trips', C.ink], ['÷ 2,500 groups', C.ink], ['= 2 per group', C.amber]], C.amber), ...say('5,000 ÷ 2,500 = 2 TRIPS PER GROUP', C.amber));

  await until(S(25));
  await play(new M.LaggedStart(W.trips.map(t => new M.Indicate(t, { color: C.green, scaleFactor: 1.1 })), { lagRatio: 0.2, runTime: 1.2 }),
    ...fbox([['trips for a fixed', C.ink], ['number of residents', C.ink], ['= a rate', C.green]], C.green), ...say('RATE = TRIPS FOR A FIXED NUMBER', C.green));

  // =========================================================================
  // 26-28: share a group's trips across its 10 people
  // =========================================================================
  const pc = P ? [0, -0.9] : [-2.45, -0.4];
  const pBox = new M.RoundedRectangle({ width: P ? 7.4 : 6.6, height: P ? 3.0 : 2.7, cornerRadius: 0.16, color: C.violet, strokeWidth: 2.5 }); pBox.setFill(C.card, 0.95); pBox.moveTo([pc[0], pc[1], 0]);
  const pHead = txt('1 group of 10 people', P ? 19 : 19, C.violet, [pc[0], pc[1] + (P ? 1.15 : 1.0), 0], false, true);
  const pSp = P ? 0.68 : 0.6;
  const pPeople = Array.from({ length: 10 }, (_, i) => rider(pc[0] + (i - 4.5) * pSp, pc[1] - 0.05, C.violet, 1.2));
  const tokRow = n => new M.VGroup(...Array.from({ length: n }, (_, i) => token(pc[0] + (i - (n - 1) / 2) * 0.45, pc[1] + 0.55)));
  const shareRow = v => new M.VGroup(...Array.from({ length: 10 }, (_, i) => txt(v, P ? 16 : 16, C.amber, [pc[0] + (i - 4.5) * pSp, pc[1] - 0.6, 0], true, true)));
  let toks = tokRow(2);
  await until(S(26));
  await play(new M.FadeOut(new M.VGroup(head, ...rowBg, ...W.names, ...W.groups, ...W.trips)),
    new M.FadeIn(new M.VGroup(pBox, pHead, ...pPeople)), new M.FadeIn(toks),
    ...fbox([['share the trips', C.ink], ['again, across', C.ink], ['the 10 people', C.violet]], C.violet), ...say('SHARE AGAIN ACROSS 10 PEOPLE', C.violet));

  let shares = shareRow('0.2');
  await until(S(27));
  await play(new M.FadeIn(shares), ...fbox([['2 trips ÷ 10 people', C.ink], ['= 0.2 per person', C.amber]], C.amber), ...say('2 ÷ 10 = 0.2 PER PERSON', C.amber));

  const toks6 = tokRow(6), shares6 = shareRow('0.6');
  await until(S(28));
  await play(new M.FadeOut(toks), new M.FadeIn(toks6), new M.FadeOut(shares), new M.FadeIn(shares6),
    ...fbox([['6 trips ÷ 10 people', C.ink], ['= 0.6 per person', C.amber]], C.amber), ...say('6 ÷ 10 = 0.6 PER PERSON', C.amber));
  toks = toks6; shares = shares6;

  // =========================================================================
  // 29-34: the rate table
  // =========================================================================
  const rcX = P ? [-2.55, -0.6, 1.0, 2.75] : [-5.5, -3.6, -1.6, 0.45];
  const rY = P ? [0.7, -0.6, -1.9] : [0.7, -0.4, -1.5];
  const hdr = new M.VGroup(...['area', 'trips/day', 'residents', 'per resident'].map((s, i) => txt(s, P ? 15 : 16, C.muted, [rcX[i], P ? 1.5 : 1.35, 0], false, true)));
  const rRows = [0, 1, 2].map(k => {
    const bg = new M.RoundedRectangle({ width: P ? 7.7 : 7.8, height: P ? 1.05 : 0.9, cornerRadius: 0.12, color: k === 1 ? C.green : C.line, strokeWidth: k === 1 ? 2.2 : 1.5 });
    bg.setFill(C.card, 0.92); bg.moveTo([P ? 0 : -2.55, rY[k], 0]);
    return new M.VGroup(bg, txt(NAMES[k], P ? 18 : 19, C.ink, [rcX[0], rY[k], 0], false, true), txt(TRIPS[k], P ? 18 : 19, C.ink, [rcX[1], rY[k], 0], true),
      txt(RES[k], P ? 18 : 19, C.violet, [rcX[2], rY[k], 0], true));
  });
  const rVals = [0, 1, 2].map(k => txt(RATE[k], P ? 24 : 24, k === 1 ? C.green : C.amber, [rcX[3], rY[k], 0], true, true));
  for (const k of [0, 1, 2]) {
    await until(S(k + 29));
    const a = k === 0 ? [new M.FadeOut(new M.VGroup(pBox, pHead, ...pPeople, toks, shares)), new M.FadeIn(hdr), new M.FadeIn(new M.VGroup(...rRows))] : [];
    await play(...a, new M.FadeIn(rVals[k], { scale: 1.3 }),
      ...fbox([[`${NAMES[k]}: ${TRIPS[k]} ÷ ${RES[k]}`, C.ink], [`= ${RATE[k]} per resident`, k === 1 ? C.green : C.amber]], k === 1 ? C.green : C.amber),
      ...say(`${NAMES[k].toUpperCase()}: ${RATE[k]} TRIPS PER RESIDENT`, k === 1 ? C.green : C.amber));
  }

  await until(S(32));
  await play(new M.Indicate(hdr.submobjects[3], { color: C.cyan, scaleFactor: 1.3 }),
    ...fbox([['unit:', C.muted], ['daily trips', C.cyan], ['per resident', C.cyan]], C.cyan), ...say('UNIT: DAILY TRIPS PER RESIDENT'));
  await until(S(33));
  await play(...fbox([['per = for each', C.cyan]], C.cyan), ...say('PER = FOR EACH'));
  await until(S(34));
  await play(new M.Indicate(rVals[0], { color: C.amber, scaleFactor: 1.3 }),
    ...fbox([['0.2 is part of a trip:', C.ink], ['an average shares', C.ink], ['the total across', C.ink], ['the whole group', C.ink]], C.amber), ...say('AN AVERAGE CAN BE PART OF A TRIP', C.amber));

  // =========================================================================
  // 35-39: the rate map
  // =========================================================================
  const rateL = k => [RATE[k] + ' per resident', P ? 19 : 18, true];
  const keyRate = keyCard('trips / resident', [['light', '0.2'], ['dark', '0.6']]);
  await until(S(35));
  await play(new M.FadeOut(new M.VGroup(hdr, ...rRows, ...rVals)),
    ...[0, 1, 2].flatMap(k => setTile(k, RATE_SH[k], [nameL(k), rateL(k)])), new M.FadeIn(keyRate), new M.FadeIn(compass),
    ...fbox([['shade by', C.ink], ['trips per resident', C.green]], C.green), ...say('SHADE BY TRIPS PER RESIDENT', C.green));

  await until(S(36));
  await play(new M.Indicate(tiles[1], { color: C.green, scaleFactor: 1.05 }),
    ...fbox([['Center: darkest', C.green], ['North = South:', C.ink], ['same shade', C.ink]], C.green), ...say('CENTER DARKEST, NORTH = SOUTH', C.green));

  await until(S(37));
  await play(...fbox([['the number we', C.ink], ['divide by =', C.ink], ['the denominator', C.violet], ['(here: residents)', C.muted]], C.violet), ...say('DENOMINATOR = WHAT WE DIVIDE BY', C.violet));

  await until(S(38));
  await play(...fbox([['the formula', C.cyan], ['in words:', C.cyan]], C.cyan), ...say('THE FORMULA IN WORDS'));
  await until(S(39));
  await play(...fbox([['trips per resident', C.green], ['= daily trips', C.ink], ['÷ residents', C.violet]], C.green), ...say('TRIPS ÷ RESIDENTS', C.green));

  // =========================================================================
  // 40-44: count map vs rate map; trap; recap
  // =========================================================================
  const twoW = P ? 3.6 : 2.9, twoH = P ? 1.25 : 0.95;
  const twoY = P ? [0.55, -0.85, -2.25] : [0.75, -0.35, -1.45];
  const cX = P ? -1.95 : -4.75, rX = P ? 1.95 : -1.55;
  const capC = txt('COUNT MAP', P ? 18 : 17, C.cyan, [cX, twoY[0] + twoH / 2 + 0.3, 0], true, true);
  const capR = txt('RATE MAP', P ? 18 : 17, C.green, [rX, twoY[0] + twoH / 2 + 0.3, 0], true, true);
  const cntTiles = [null, null, null], rtTiles = [null, null, null];
  const twoLines = (k, v) => [[NAMES[k], P ? 18 : 17, true], [v, P ? 20 : 19, true]];
  await until(S(40));
  await play(new M.FadeOut(new M.VGroup(...tiles, keyRate, compass)),
    ...[0, 1, 2].flatMap(k => setTile(k, COUNT_SH[k], twoLines(k, TRIPS[k] + ' trips'), { x: cX, w: twoW, h: twoH, y: twoY[k], arr: cntTiles })),
    ...[0, 1, 2].flatMap(k => setTile(k, RATE_SH[k], twoLines(k, RATE[k] + ' / resident'), { x: rX, w: twoW, h: twoH, y: twoY[k], arr: rtTiles, border: C.green })),
    new M.FadeIn(capC), new M.FadeIn(capR),
    ...fbox([['different numbers', C.ink], ['of residents?', C.ink], ['use the RATE map', C.green]], C.green), ...say('COMPARE AREAS: USE THE RATE MAP', C.green));
  tiles.fill(null);

  await until(S(41));
  await play(new M.LaggedStart(cntTiles.map(t => new M.Indicate(t, { color: C.cyan, scaleFactor: 1.04 })), { lagRatio: 0.2, runTime: 1.2 }),
    ...fbox([['total number of trips?', C.ink], ['use the COUNT map', C.cyan]], C.cyan), ...say('TOTAL TRIPS: USE THE COUNT MAP'));

  await until(S(42));
  await play(new M.Indicate(rtTiles[0], { color: C.pink, scaleFactor: 1.04 }),
    ...fbox([['trap: 0.2 is NOT', C.pink], ['how often each', C.ink], ['resident rides', C.ink]], C.pink), ...say('TRAP: NOT A RECORD OF EACH RIDER', C.pink));

  // 43: some trips come from people who live elsewhere (a visitor rides into Center)
  const vx = P ? 1.95 : -1.55, vy = twoY[2] - twoH / 2 - (P ? 0.75 : 0.6);
  const visitor = rider(vx - (P ? 1.6 : 1.8), vy, C.amber, 1.2);
  const vArrow = new M.Arrow({ start: [vx - (P ? 1.3 : 1.5), vy, 0], end: [vx - 0.2, vy, 0], color: C.amber, strokeWidth: 3 });
  const vLab = txt('lives elsewhere', P ? 17 : 16, C.amber, [vx + (P ? 0.75 : 0.9), vy, 0], false, true);
  await until(S(43));
  await play(new M.FadeIn(visitor), new M.Create(vArrow), new M.FadeIn(vLab),
    ...fbox([['some trips come from', C.ink], ['people who live', C.ink], ['elsewhere', C.amber]], C.amber), ...say('SOME RIDERS LIVE ELSEWHERE', C.amber));

  await until(S(44));
  await play(new M.FadeOut(new M.VGroup(visitor, vArrow, vLab)),
    ...fbox([['divide trips by', C.ink], ['residents first,', C.violet], ['then shade', C.green]], C.green), ...say('DIVIDE FIRST, THEN SHADE', C.green));
}

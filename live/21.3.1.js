// 21.3.1 Vision tokens: cut the picture into patches, each patch becomes one tagged vector.
// Beat i = sentence i (0-based). Runs in site/live/engine.js. Numbers from chapters/21.3.md.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const ORANGE = '#fb923c', SIGN = '#fde047', RED = '#f87171', BLUE = '#60a5fa';
  // laptop: map left, work zone right, token row along the bottom; phone: map in the middle, zone and row below
  const PS = P ? 1.9 : 1.25, U = PS / 100;                         // one patch side; scene units per map pixel
  const MX = P ? 0 : -3.9, MY = P ? -0.3 : 0;
  const PILL = P ? [0, 2.05, 0] : [-2.4, 1.85, 0];
  const BOXP = P ? [0, 3.35, 0] : [4.3, 1.0, 0];
  const RY = P ? -3.35 : -2.05, TX = k => P ? (k - 2.5) * 1.2 : -5.9 + k * 1.2;
  const mp = (x, y) => [MX + (x - 150) * U, MY + (y - 100) * U, 0];      // map pixel (y up) -> scene
  const pc = k => [50 + 100 * (k % 3), 150 - 100 * Math.floor(k / 3)];  // centre of patch k in pixels
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const VEC = [0.9, 0.1, 0.4, 0.7];
  const val = (k, j) => { const x = Math.sin(k * 12.99 + j * 78.23) * 43758.5; return 0.2 + 0.7 * (x - Math.floor(x)); };
  const vals = k => k === 1 ? VEC : [0, 1, 2, 3].map(j => val(k, j));
  const WORDS = ['where', 'is', 'the', 'library', '?'];
  const B = [ // patches 1..6 in reading order: building centre and size in pixels
    { name: 'Pond', color: C.violet, c: [50, 160] },
    { name: 'Library', color: C.cyan, c: [150, 166], w: 56, h: 38 },
    { name: 'Lab building', color: C.green, c: [250, 164], w: 60, h: 42 },
    { name: 'Cafeteria', color: ORANGE, c: [50, 70], w: 56, h: 36 },
    { name: 'Main gate', color: C.ink, c: [150, 9] },
    { name: 'Sports hall', color: C.pink, c: [250, 70], w: 64, h: 42 },
  ];

  function rect(w, h, color, p, fill = null, op = 0.8, sw = 2) {
    const r = new M.Rectangle({ width: w, height: h, color, strokeWidth: sw });
    if (fill) r.setFill(fill, op);
    r.moveTo(p); return r;
  }
  function label(s, size, color, p, maxw = 99, mono = false) {
    const t = T(s, size, color, mono);
    if (t.getWidth() > maxw) t.scale(maxw / t.getWidth());
    t.moveTo(p); return t;
  }
  const outline = (x0, y0, x1, y1, color) => rect(x1 - x0, y1 - y0, color, [(x0 + x1) / 2, (y0 + y1) / 2, 0], null, 0, 3);
  const cells = (vs, cx, y, w, h, color) => vs.map((v, j) => rect(w, h, color, [cx + (j - 1.5) * w, y, 0], color, 0.1 + 0.5 * v, 1.5));
  const arrow = (x0, y, x1) => new M.Arrow({ start: [x0, y, 0], end: [x1, y, 0], color: C.muted });
  const fin = (xs, runTime = 1, lagRatio = 0.1) => new M.LaggedStart(xs.map(x => new M.FadeIn(x)), { lagRatio, runTime });
  const draw = (xs, runTime = 1, lagRatio = 0.1) => new M.LaggedStart(xs.map(x => new M.Create(x)), { lagRatio, runTime });
  const out = (...xs) => new M.FadeOut(new M.VGroup(...xs.flat()));
  function layoutRow(items, ws, x0, x1, y, gap = 0.14) {
    const tot = ws.reduce((a, b) => a + b, 0) + gap * (items.length - 1), k = Math.min(1, (x1 - x0) / tot);
    let x = (x0 + x1) / 2 - tot * k / 2;
    items.forEach((it, i) => { if (k < 1) it.scale(k); it.moveTo([x + ws[i] * k / 2, y, 0]); x += (ws[i] + gap) * k; });
  }

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
    const maxw = P ? FW - 1.2 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const unbox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // the campus map: dark card, glowing buildings, names and patch numbers (shown when said)
  function makeMap() {
    const frame = rect(3 * PS, 2 * PS, C.muted, [MX, MY, 0], C.card, 0.9, 2);
    const bld = B.map((b, k) => {
      if (k === 0) { const c = new M.Circle({ radius: 26 * U, color: b.color }); c.setFill(b.color, 0.6); c.moveTo(mp(...b.c)); return c; }
      if (k === 4) return new M.VGroup(rect(7 * U, 18 * U, b.color, mp(137, 9), b.color, 0.85, 1.5), rect(7 * U, 18 * U, b.color, mp(163, 9), b.color, 0.85, 1.5));
      if (k === 5) { const r = new M.RoundedRectangle({ width: b.w * U, height: b.h * U, cornerRadius: 0.08, color: b.color, strokeWidth: 2 }); r.setFill(b.color, 0.6); r.moveTo(mp(...b.c)); return r; }
      return rect(b.w * U, b.h * U, b.color, mp(...b.c), b.color, 0.6);
    });
    const names = B.map((b, k) => label(b.name, P ? 17 : 16, C.ink, mp(pc(k)[0], k < 3 ? 118 : 30), PS * 0.96));
    const nums = B.map((_, k) => label(String(k + 1), P ? 17 : 15, C.muted, mp(pc(k)[0] - 38, pc(k)[1] + 38), 1, true));
    return { frame, bld, names, nums };
  }
  const cut = (x0, y0, x1, y1, color) => new M.DashedLine({ start: mp(x0, y0), end: mp(x1, y1), color, strokeWidth: 2 });
  const cuts100 = () => [cut(100, 0, 100, 200, C.amber), cut(200, 0, 200, 200, C.amber), cut(0, 100, 300, 100, C.amber)];
  // counters across: above the map on a laptop, below it on a phone; counters down: left of the map
  const ACY = P ? MY - PS - 0.27 : MY + PS + 0.17, DNX = MX - 1.5 * PS - 0.45;
  const across = (ts, c = C.amber) => ts.map((s, i) => label(s, P ? 16 : 14, c, [MX - 1.5 * PS + (i + 0.5) * 3 * PS / ts.length, ACY, 0], 3 * PS / ts.length - 0.05, true));
  const down = (ts, c = C.amber) => ts.map((s, i) => label(s, P ? 16 : 14, c, [DNX, MY + PS - (i + 0.5) * 2 * PS / ts.length, 0], 0.75, true));
  const count = n => Array.from({ length: n }, (_, i) => String(i + 1));
  function dims(wt, h1, h2) {
    const yb = MY - PS - 0.17, xl = MX - 1.5 * PS - 0.17, t = 0.08, ln = (a, b) => new M.Line({ start: a, end: b, color: C.muted, strokeWidth: 2 });
    const lines = [ln([MX - 1.5 * PS, yb, 0], [MX + 1.5 * PS, yb, 0]),
      ...[-1, 1].map(s => ln([MX + s * 1.5 * PS, yb - t, 0], [MX + s * 1.5 * PS, yb + t, 0])),
      ln([xl, MY - PS, 0], [xl, MY + PS, 0]),
      ...[-1, 1].map(s => ln([xl - t, MY + s * PS, 0], [xl + t, MY + s * PS, 0]))];
    const texts = [label(wt, 17, C.ink, [MX, yb - 0.27, 0], 3, true),
      label(h1, 17, C.ink, [xl - 0.4, MY + 0.15, 0], 0.7, true), label(h2, 17, C.ink, [xl - 0.4, MY - 0.15, 0], 0.7, true)];
    return { lines, texts };
  }
  // one token card: patch thumbnail, its 4-number vector, its name
  function card(k) {
    const x = TX(k), col = B[k].color;
    return new M.VGroup(rect(0.46, 0.46, col, [x, RY + 0.32, 0], col, 0.45, 2),
      ...cells(vals(k), x, RY - 0.08, 0.24, 0.2, col),
      label(B[k].name, 13, C.ink, [x, RY - 0.4, 0], 1.12));
  }
  // library patch -> one vector (work zone)
  const PY = P ? -3.6 : -0.5, THX = P ? -2.6 : 2.0, PVX = P ? 0.1 : 4.35, k9 = 0.9 / 100;
  function pipeline() {
    return {
      fr: rect(0.9, 0.9, C.cyan, [THX, PY, 0], C.card, 0.95, 2),
      lib: rect(56 * k9, 38 * k9, C.cyan, [THX, PY + 16 * k9, 0], C.cyan, 0.6, 1.5),
      sg: rect(12 * k9, 8 * k9, SIGN, [THX - 36 * k9, PY - 26 * k9, 0], SIGN, 1, 1),
      ar: arrow(THX + 0.55, PY, PVX - 1.15),
      vc: cells(VEC, PVX, PY, 0.5, 0.34, C.cyan),
    };
  }

  // 0-1 the campus map, photographed
  let map = makeMap();
  await until(S(0));
  await play(new M.FadeIn(map.frame), fin(map.bld, 1.8, 0.25), ...say('FIRST VISIT TO A CAMPUS'));
  const corners = [];
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = MX + sx * (1.5 * PS + 0.12), y = MY + sy * (PS + 0.12);
    corners.push(new M.Line({ start: [x, y, 0], end: [x - sx * 0.4, y, 0], color: C.ink, strokeWidth: 3 }),
      new M.Line({ start: [x, y, 0], end: [x, y - sy * 0.4, 0], color: C.ink, strokeWidth: 3 }));
  }
  await until(S(1)); await play(draw(corners, 1.0, 0.1), ...say('“WHERE IS THE LIBRARY?”', C.amber));

  // 2-3 how a language model reads text
  const DY = P ? 0.2 : 0.3;
  const sentence = label('where is the library?', P ? 30 : 36, C.ink, [0, DY, 0], FW - 1);
  const wp = WORDS.map(w => pill(w, C.cyan, P ? 18 : 22));
  const slotW = wp.map(q => Math.max(q.submobjects[0].getWidth(), 1.0) + 0.16);
  const totW = slotW.reduce((a, b) => a + b, 0), ks = Math.min(1, (FW - 0.6) / totW), wx = [];
  let xx = -totW * ks / 2;
  wp.forEach((q, i) => { if (ks < 1) q.scale(ks); wx.push(xx + slotW[i] * ks / 2); q.moveTo([wx[i], DY, 0]); xx += slotW[i] * ks; });
  await until(S(2));
  await play(out(map.frame, map.bld, corners), new M.FadeIn(sentence), ...say('TEXT → SMALL PIECES: TOKENS'));
  await play(new M.FadeOut(sentence), fin(wp, 1.2, 0.2));
  const wcells = WORDS.map((_, i) => new M.VGroup(...cells([0, 1, 2, 3].map(j => val(i + 7, j)), wx[i], DY - 0.55, 0.22, 0.2, C.cyan)));
  const readArrow = arrow(wx[0] - 0.5, DY - 0.95, wx[4] + 0.5);
  await until(S(3)); await play(fin(wcells, 1.4, 0.2), ...say('EACH TOKEN → A SHORT LIST OF NUMBERS'));
  await play(new M.Create(readArrow));

  // 4-7 the photo: 300 x 200 pixels, each pixel three numbers
  map = makeMap();
  await until(S(4));
  await play(out(wp, wcells, readArrow), new M.FadeIn(map.frame), fin(map.bld, 1.0, 0.1), ...say('A PHOTO IS NOT TEXT. HOW TO READ IT?', C.pink));
  const dm = dims('300 px', '200', 'px');
  await until(S(5)); await play(draw(dm.lines, 1.0, 0.1), fin(dm.texts, 1.0, 0.2), ...say('300 × 200 PIXELS'));
  const ZG = P ? [-1.8, -4.0] : [2.6, -1.3], ZC = 0.3;
  const probe = rect(0.14, 0.14, C.amber, mp(140, 172), null, 0, 2);
  const zoom = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++)
    zoom.push(rect(ZC, ZC, C.line, [ZG[0] + (c - 2) * ZC, ZG[1] + (2 - r) * ZC, 0], C.cyan, r === 2 && c === 2 ? 1 : 0.3 + 0.5 * val(r + 20, c), 1));
  const zframe = rect(5 * ZC + 0.08, 5 * ZC + 0.08, C.amber, [ZG[0], ZG[1], 0], null, 0, 2);
  const pix = rect(ZC + 0.04, ZC + 0.04, C.amber, [ZG[0], ZG[1], 0], null, 0, 3);
  await until(S(6)); await play(new M.Create(probe), new M.FadeIn(zframe), fin(zoom, 1.0, 0.02), ...say('PIXEL = ONE TINY COLOURED DOT'));
  await play(new M.Create(pix), new M.Flash(pix, { color: C.amber }));
  const RX = P ? 0.2 : 4.5;
  const rgb = [['R', 90, RED], ['G', 215, C.green], ['B', 232, BLUE]];
  const rgbCells = rgb.map(([, , c], i) => rect(0.75, 0.5, c, [RX + i * 0.9, ZG[1], 0], c, 0.18, 2));
  const rgbNums = rgb.map(([, v], i) => label(String(v), 18, C.ink, [RX + i * 0.9, ZG[1], 0], 0.65, true));
  const rgbLets = rgb.map(([l, , c], i) => label(l, 18, c, [RX + i * 0.9, ZG[1] + 0.45, 0], 1, true));
  const rgbArrow = arrow(ZG[0] + 2.5 * ZC + 0.1, ZG[1], RX - 0.45);
  await until(S(7)); await play(new M.Create(rgbArrow), fin([...rgbCells, ...rgbLets], 1.6, 0.25), ...say('RED, GREEN, BLUE: 3 NUMBERS'));
  await play(fin(rgbNums, 1.4, 0.3));

  // 8-11 cut the map like a jigsaw: 3 across, 2 down, 6 patches
  const cuts = cuts100(), acr = across(count(3)), dn = down(count(2));
  await until(S(8));
  await play(out(probe, zframe, zoom, pix, rgbArrow, rgbCells, rgbNums, rgbLets, dm.lines, dm.texts), ...say('LIKE A JIGSAW: CUT INTO PIECES', C.amber));
  await play(new M.Indicate(map.frame, { color: C.amber }), draw(cuts, 1.2, 0.3));
  const first = rect(PS, PS, C.amber, mp(50, 150), null, 0, 4);
  await until(S(9)); await play(new M.Create(first), ...say('SQUARE = 100 × 100 PIXELS', C.amber));
  await until(S(10)); await play(fin([...acr, ...dn], 1.4, 0.2), ...say('3 ACROSS × 2 DOWN = 6 SQUARES', C.amber));
  await until(S(11)); await play(out(first, acr, dn), fin(map.nums, 1.2, 0.2), ...say('EACH SQUARE = ONE PATCH'));

  // 12-13 what each patch shows
  await until(S(12)); await play(fin(map.names.slice(0, 3), 2.4, 0.5), ...say('TOP ROW', C.ink));
  await until(S(13)); await play(fin(map.names.slice(3), 2.6, 0.5), ...say('BOTTOM ROW', C.ink));

  // 14-15 one patch: 10,000 pixels, 30,000 numbers
  const libOut = rect(PS, PS, C.cyan, mp(150, 150), null, 0, 4);
  const EP = P ? [-1.9, -4.0] : [2.6, -1.35], ES = 1.6, ek = ES / 100;
  const epFrame = rect(ES, ES, C.cyan, [EP[0], EP[1], 0], C.card, 0.95, 2);
  const epGrid = [];
  for (let i = 1; i < 10; i++) {
    const d = -ES / 2 + i * ES / 10;
    epGrid.push(new M.Line({ start: [EP[0] + d, EP[1] - ES / 2, 0], end: [EP[0] + d, EP[1] + ES / 2, 0], color: C.grid, strokeWidth: 1 }),
      new M.Line({ start: [EP[0] - ES / 2, EP[1] + d, 0], end: [EP[0] + ES / 2, EP[1] + d, 0], color: C.grid, strokeWidth: 1 }));
  }
  const epLib = rect(56 * ek, 38 * ek, C.cyan, [EP[0], EP[1] + 16 * ek, 0], C.cyan, 0.6, 2);
  const epLabs = [label('100 px', 15, C.muted, [EP[0], EP[1] - ES / 2 - 0.22, 0], 2, true), label('100 px', 15, C.muted, [EP[0] + ES / 2 + 0.5, EP[1], 0], 1, true)];
  await until(S(14));
  await play(new M.Create(libOut), new M.FadeIn(epFrame), fin(epGrid, 0.6, 0.01), new M.FadeIn(epLib), fin(epLabs),
    ...fbox(['100 × 100', ['= 10,000 pixels', C.amber]]), ...say('ZOOM: THE LIBRARY PATCH'));
  await until(S(15)); await play(...fbox(['10,000 pixels × 3', ['= 30,000 numbers', C.amber]]), ...say('3 NUMBERS FOR EVERY PIXEL'));

  // 16-18 far too long, so a learned squeezing step
  const BX0 = P ? -3.08 : 1.3, BP = P ? 0.22 : 0.2, NL = P ? 28 : 27, SBY = P ? -2.75 : -0.25, LBY = P ? -3.2 : -0.7;
  const shortBar = [0, 1, 2, 3].map(j => rect(BP - 0.03, 0.2, C.cyan, [BX0 + (j + 0.5) * BP, SBY, 0], C.cyan, 0.7, 1));
  const longBar = Array.from({ length: NL }, (_, j) => rect(BP - 0.03, 0.2, C.pink, [BX0 + (j + 0.5) * BP, LBY, 0], C.pink, 0.7, 1));
  await until(S(16));
  await play(out(epFrame, epGrid, epLib, epLabs), fin(shortBar, 0.6, 0.2), ...fbox([['text token: 4 numbers', C.cyan], ['one patch: 30,000 numbers', C.pink]]));
  await play(fin(longBar, 1.6, 0.05), ...say('FAR TOO LONG', C.pink));
  const FT = P ? -3.45 : -0.95, FB = P ? -4.35 : -1.85, ZVX = P ? 0 : 4.0, VY = P ? -4.75 : -2.25;
  const funnel = new M.Polygon({ vertices: [[BX0, FT, 0], [BX0 + NL * BP, FT, 0], [ZVX + 1.25, FB, 0], [ZVX - 1.25, FB, 0]], color: C.violet, strokeWidth: 2 });
  funnel.setFill(C.violet, 0.12);
  const sqz = label('squeeze', 17, C.violet, [ZVX, (FT + FB) / 2, 0], 2, true);
  const vec = cells(VEC, ZVX, VY, 0.6, 0.36, C.cyan);
  await until(S(17)); await play(out(shortBar), new M.Create(funnel), new M.FadeIn(sqz), ...say('SQUEEZE: ONE PATCH → ONE SHORT LIST', C.violet));
  await play(new M.LaggedStart(longBar.map(b => new M.Transform(b, rect(0.06, 0.06, C.pink, [ZVX, FB + 0.08, 0], C.pink, 0.7, 1))), { lagRatio: 0.05, runTime: 1.6 }));
  await play(out(longBar), fin(vec, 0.8, 0.15));
  const SK = P ? [-2.95, -4.85] : [1.95, -2.3];
  const stack = [0, 1, 2, 3].map(i => rect(0.5, 0.36, C.violet, [SK[0] + i * 0.08, SK[1] + i * 0.08, 0], C.card, 0.95, 1.5));
  await until(S(18)); await play(fin(stack, 1.2, 0.3), ...say('LEARNED FROM MANY PICTURES', C.violet));
  await play(new M.Indicate(funnel, { color: C.violet }));

  // 19-22 the vector: 4 numbers in our picture
  const vlabel = label('vector', 17, C.green, [ZVX + 1.75, VY, 0], 1.2);
  await until(S(19)); await play(new M.FadeIn(vlabel), ...say('SHORT LIST OF NUMBERS = VECTOR', C.green));
  await play(new M.LaggedStart(vec.map(c => new M.Indicate(c, { color: C.green })), { lagRatio: 0.2, runTime: 1.0 }));
  const vcount = [0, 1, 2, 3].map(j => label(String(j + 1), 15, C.muted, [ZVX + (j - 1.5) * 0.6, VY - 0.42, 0], 1, true));
  await until(S(20)); await play(fin(vcount, 1.4, 0.3), ...say('4 NUMBERS IN EACH VECTOR'));
  const vnums = VEC.map((v, j) => label(String(v), 17, C.ink, [ZVX + (j - 1.5) * 0.6, VY, 0], 0.5, true));
  await until(S(21)); await play(fin(vnums, 3.0, 0.5), ...fbox(['library patch →', ['(0.9, 0.1, 0.4, 0.7)', C.cyan]]), ...say('LIBRARY PATCH → 4 NUMBERS'));
  await until(S(22)); await play(...fbox(['our picture: 4 numbers', ['real models: about 1,000', C.muted]]), ...say('REAL MODELS: ABOUT 1,000 NUMBERS', C.muted));

  // 23-25 six vectors in reading order lose the layout
  const cards = B.map((_, k) => card(k));
  await until(S(23));
  await play(out(funnel, sqz, stack, vec, vnums, vcount, vlabel, libOut), ...unbox(), ...say('READING ORDER: TOP ROW, THEN BOTTOM'));
  await play(new M.LaggedStart(cards.map(g => new M.FadeIn(g, { shift: [0, -0.15, 0] })), { lagRatio: 0.6, runTime: 3.2 }),
    new M.LaggedStart(map.nums.map(n => new M.Indicate(n, { color: C.amber })), { lagRatio: 0.6, runTime: 3.2 }));
  const rowPair = outline(TX(2) - 0.58, RY - 0.56, TX(3) + 0.58, RY + 0.62, C.amber);
  await until(S(24)); await play(new M.Create(rowPair), ...say('IN THE ROW: SIDE BY SIDE', C.amber));
  const mapPair = [rect(PS, PS, C.pink, mp(250, 150), null, 0, 4), rect(PS, PS, C.pink, mp(50, 50), null, 0, 4)];
  await until(S(25)); await play(draw(mapPair, 1.0, 0.4), ...say('FAR APART ON THE MAP: LAYOUT LOST', C.pink));

  // 26-29 position tags: six tagged vectors = vision tokens
  const tags = B.map((_, k) => pill(`(${Math.floor(k / 3) + 1},${k % 3 + 1})`, C.amber, 16).moveTo([TX(k), RY - 0.74, 0]));
  await until(S(26)); await play(out(rowPair, mapPair), fin(tags, 2.0, 0.3), ...say('TAG = (ROW, COLUMN)', C.amber));
  const colL = across(['col 1', 'col 2', 'col 3']), rowL = down(['row 1', 'row 2']);
  const libOut2 = rect(PS, PS, C.cyan, mp(150, 150), null, 0, 4);
  await until(S(27)); await play(fin([...rowL, ...colL], 1.2, 0.15), new M.Create(libOut2), ...say('LIBRARY: ROW 1, COLUMN 2'));
  await play(new M.Indicate(tags[1], { color: C.cyan }));
  const rowBox = outline(TX(0) - 0.6, RY - 0.95, TX(5) + 0.6, RY + 0.62, C.green);
  await until(S(28)); await play(out(libOut2), new M.Create(rowBox), ...say('SIX TAGGED VECTORS = VISION TOKENS', C.green));
  await until(S(29)); await play(...fbox(['vision token =', '1 patch → 1 vector + tag', ['read like a word', C.green]], C.green));

  // 30 one long row: picture, then the question
  const qp = WORDS.map(w => pill(w, C.amber, P ? 15 : 17));
  layoutRow(qp, qp.map(q => q.submobjects[0].getWidth()), P ? -3.7 : 0.85, P ? 3.7 : 6.85, P ? -5.0 : RY + 0.3);
  const rowArrows = P ? [arrow(-3.6, RY + 0.95, 3.6), arrow(-3.6, -4.55, 3.6)] : [arrow(-6.5, RY + 0.95, 6.85)];
  await until(S(30));
  await play(out(map.frame, map.bld, map.names, map.nums, colL, rowL, rowBox), ...unbox(), fin(qp, 1.4, 0.2), ...say('ONE ROW: PICTURE, THEN QUESTION'));
  await play(draw(rowArrows, 1.0, 0.3));

  // 31-34 how many: (W ÷ p) × (H ÷ p)
  const map2 = makeMap();
  await until(S(31)); await play(out(cards, tags, qp, rowArrows), new M.FadeIn(map2.frame), fin(map2.bld, 1.0, 0.1), ...say('HOW MANY VISION TOKENS?', C.amber));
  const dm2 = dims('W = 300 px', 'H =', '200');
  await until(S(32)); await play(draw(dm2.lines, 1.0, 0.1), fin(dm2.texts, 1.0, 0.2), ...fbox(['patches = (W ÷ p) × (H ÷ p)', ['p = patch size = 100 px', C.muted]]));
  const cuts2 = cuts100(), acr2 = across(count(3)), dn2 = down(count(2));
  await until(S(33)); await play(out(dm2.lines, dm2.texts), draw(cuts2, 1.0, 0.2), fin([...acr2, ...dn2], 1.4, 0.2), ...fbox(['300 ÷ 100 = 3 across', '200 ÷ 100 = 2 down']));
  await until(S(34)); await play(fin(map2.nums, 1.2, 0.2), ...fbox(['300 ÷ 100 = 3', '200 ÷ 100 = 2', ['3 × 2 = 6 vision tokens', C.amber]], C.amber), ...say('6 VISION TOKENS', C.amber));

  // 35-36 what it is for
  const mini = [...B.map(b => rect(0.36, 0.36, b.color, [0, 0, 0], b.color, 0.5, 1.5)), ...WORDS.map(w => pill(w, C.amber, 14))];
  layoutRow(mini, mini.map((m, i) => i < 6 ? 0.36 : m.submobjects[0].getWidth()), -FW / 2 + 0.4, FW / 2 - 0.4, P ? -3.2 : -2.1, 0.1);
  await until(S(35)); await play(out(acr2, dn2), ...unbox(), fin(mini, 1.6, 0.12), ...say('READ A PICTURE LIKE TEXT', C.green));
  const IC = P ? [[-2.5, 3.35], [0, 3.35], [2.5, 3.35]] : [[2.2, 0.2], [3.9, 0.2], [5.6, 0.2]];
  function icon([x, y], k) {
    const fr = rect(1.2, 0.8, C.muted, [x, y, 0], C.card, 0.95, 2), ln = (a, b) => new M.Line({ start: a, end: b, color: C.muted, strokeWidth: 1 });
    if (k === 0) return [fr, ln([x - 0.2, y - 0.4, 0], [x - 0.2, y + 0.4, 0]), ln([x + 0.2, y - 0.4, 0], [x + 0.2, y + 0.4, 0]), ln([x - 0.6, y, 0], [x + 0.6, y, 0]),
      rect(0.18, 0.14, C.cyan, [x, y + 0.2, 0], C.cyan, 0.7, 1)];
    if (k === 1) {
      const hill = new M.Polygon({ vertices: [[x - 0.45, y - 0.3, 0], [x - 0.1, y + 0.15, 0], [x + 0.25, y - 0.3, 0]], color: C.green, strokeWidth: 2 });
      hill.setFill(C.green, 0.4);
      const sun = new M.Circle({ radius: 0.09, color: C.amber }); sun.setFill(C.amber, 0.9); sun.moveTo([x + 0.32, y + 0.18, 0]);
      return [fr, hill, sun];
    }
    return [fr, ...[0.25, 0.45, 0.35].map((hh, i) => rect(0.2, hh, C.violet, [x - 0.3 + i * 0.3, y - 0.32 + hh / 2, 0], C.violet, 0.6, 1))];
  }
  const icons = IC.map(icon).flat();
  const iconLabs = ['map', 'photo', 'chart'].map((s, i) => label(s, 15, C.ink, [IC[i][0], IC[i][1] - 0.62, 0], 1.2));
  await until(S(36)); await play(fin([...icons, ...iconLabs], 2.0, 0.08), ...say('ASK ABOUT A MAP, A PHOTO OR A CHART', C.green));

  // 37-40 the trap: 50-pixel patches give 24 tokens
  const cuts50 = [cut(50, 0, 50, 200, C.pink), cut(150, 0, 150, 200, C.pink), cut(250, 0, 250, 200, C.pink), cut(0, 50, 300, 50, C.pink), cut(0, 150, 300, 150, C.pink)];
  await until(S(37)); await play(out(mini, icons, iconLabs, map2.nums), draw(cuts50, 1.2, 0.2), ...say('TRAP: SMALLER PATCHES = MORE TOKENS', C.pink));
  const acr6 = across(count(6), C.pink), dn4 = down(count(4), C.pink);
  await until(S(38)); await play(fin([...acr6, ...dn4], 1.6, 0.1), ...say('50 × 50 PATCHES: 6 ACROSS, 4 DOWN', C.pink));
  const CR0 = P ? -3.4 : -6.3, CP = P ? 0.26 : 0.23, RA = P ? -3.3 : -1.8, RB = P ? -3.85 : -2.4;
  const sq = (i, y, c) => rect(CP - 0.04, CP - 0.04, c, [CR0 + (i + 0.5) * CP, y, 0], c, 0.6, 1);
  const rowA = Array.from({ length: 6 }, (_, i) => sq(i, RA, C.cyan));
  const rowB = Array.from({ length: 24 }, (_, i) => sq(i, RB, C.pink));
  const rowLabs = [label('6', 17, C.cyan, [CR0 - 0.3, RA, 0], 1, true), label('24', 17, C.pink, [CR0 - 0.3, RB, 0], 1, true)];
  await until(S(39));
  await play(fin([rowLabs[0], ...rowA], 0.8, 0.1), fin([rowLabs[1], ...rowB], 2.2, 0.06),
    ...fbox(['6 × 4 = 24 tokens', ['24 ÷ 6 = 4 times as many', C.amber]], C.pink), ...say('SAME MAP: 4 × THE TOKENS', C.pink));
  const NR = P ? 26 : 28;
  const room = rect(NR * CP + 0.06, CP + 0.12, C.muted, [CR0 + NR * CP / 2, RB, 0], null, 0, 2);
  const roomLab = label('what the model can hold', 14, C.muted, [CR0 + NR * CP - 1.0, RB + 0.42, 0], 2.0);
  await until(S(40)); await play(new M.Create(room), new M.FadeIn(roomLab), ...say('MORE WORK · LIMITED ROOM', C.amber));

  // 41-43 big patches squeeze a small sign away: a trade
  const sign = rect(12 * U, 8 * U, SIGN, mp(114, 124), SIGN, 1, 1);
  const signLab = label('small sign', 13, SIGN, mp(160, 124), 62 * U);
  const libBig = rect(PS, PS, C.cyan, mp(150, 150), null, 0, 4);
  const pipe = pipeline();
  await until(S(41));
  await play(out(cuts50, acr6, dn4, rowA, rowB, rowLabs, room, roomLab), ...unbox(), new M.FadeIn(sign), new M.FadeIn(signLab), new M.Create(libBig),
    ...say('SIGN + SURROUNDINGS → ONE VECTOR', C.amber));
  await play(new M.FadeIn(pipe.fr), new M.FadeIn(pipe.lib), new M.FadeIn(pipe.sg), new M.Create(pipe.ar), fin(pipe.vc, 0.8, 0.15));
  const lost = label('sign?', 16, C.pink, [PVX + 1.45, PY, 0], 1, true);
  await until(S(42)); await play(new M.Indicate(sign, { color: C.pink, runTime: 0.8 }), ...say('FINE DETAIL CAN BE LOST', C.pink));
  await play(new M.FadeOut(pipe.sg), new M.FadeIn(lost));
  await until(S(43)); await play(...fbox(['50 px: 24 tokens, finer detail', '100 px: 6 tokens, less work', ['patch size: detail ↔ cost', C.amber]], C.amber), ...say('A TRADE: DETAIL ↔ COST', C.amber));

  // 44 next lesson
  await until(S(44));
  await play(out(sign, signLab, libBig, pipe.fr, pipe.lib, pipe.ar, pipe.vc, lost), ...unbox(), ...say('NEXT: HOW IT KNOWS IT IS A LIBRARY', C.violet));
  await play(new M.Indicate(map2.bld[1], { color: C.violet }));

  // 45 in one sentence
  const pipe2 = pipeline();
  const pnums = VEC.map((v, j) => label(String(v), 15, C.ink, [PVX + (j - 1.5) * 0.5, PY, 0], 0.42, true));
  const ptag = pill('(1,2)', C.amber, 15).moveTo([PVX, PY - 0.5, 0]);
  const libEnd = rect(PS, PS, C.cyan, mp(150, 150), null, 0, 4);
  await until(S(45));
  await play(new M.Create(libEnd), new M.FadeIn(pipe2.fr), new M.FadeIn(pipe2.lib), new M.Create(pipe2.ar), fin(pipe2.vc, 0.8, 0.1), fin(pnums, 0.8, 0.1), new M.FadeIn(ptag),
    ...fbox(['patch → vector + tag', ['= one vision token', C.green]], C.green), ...say('PATCH → TAGGED VECTOR = VISION TOKEN', C.green));
}

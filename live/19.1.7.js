// 19.1.7 Word embeddings: placing words on a map.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const OR = '#fb923c';
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.45, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.9, 0] : [4.3, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 19);
  const fade = o => new M.FadeIn(o), out = o => new M.FadeOut(o);
  const lab = (s, size, color, x, y, mono = true) => T(s, size, color, mono).moveTo([x, y, 0]);

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const a = boxNow ? [out(boxNow)] : [];
    boxNow = null;
    if (!lines.length) return a;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, ink]) => T(s, P ? 20 : 19, ink, true));
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.56;
    const lh = P ? 0.44 : 0.4, height = rows.length * lh + 0.26;
    const [x, y] = BOXP;
    const frame = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    frame.setFill(C.card, 0.95); frame.moveTo([x, y, 0]);
    texts.forEach((t, i) => t.moveTo([x - width / 2 + 0.28 + t.getWidth() / 2, y + (rows.length - 1) * lh / 2 - i * lh, 0]));
    boxNow = new M.VGroup(frame, ...texts);
    const maxW = P ? FW - 1.0 : 4;
    if (width > maxW) boxNow.scale(maxW / width);
    boxNow.moveTo(BOXP);
    a.push(fade(boxNow));
    return a;
  }

  // review cards
  const CW = P ? 7.4 : 6.4;
  function card(text, y, color = C.muted) {
    const r = new M.RoundedRectangle({ width: CW, height: P ? 0.9 : 0.62, cornerRadius: 0.14, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([CX, y, 0]);
    const t = T(text, P ? 19 : 18, C.ink);
    if (t.getWidth() > CW - 0.6) t.scale((CW - 0.6) / t.getWidth());
    t.moveTo([CX - CW / 2 + 0.3 + t.getWidth() / 2, y, 0]);
    return new M.VGroup(r, t);
  }
  const Y1 = P ? -2.5 : 1.0, Y2 = P ? -3.8 : 0.15;
  const RA = P ? -5.2 : -0.75, RB = P ? -6.3 : -1.6, DX = P ? 2.3 : 1.7;
  // phone: a search box on top (the screen has room for it)
  let sbox = null;
  if (P) {
    const r = new M.RoundedRectangle({ width: 7.0, height: 1.0, cornerRadius: 0.5, color: C.pink, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([0, -0.6, 0]);
    const t = T('search:  slow', 26, C.ink, true); t.moveTo([-3.1 + t.getWidth() / 2, -0.6, 0]);
    sbox = new M.VGroup(r, t);
  }

  // 0-2 slow and boring
  const c2 = card('R2  A slow book. The plot is slow.', Y1, C.pink);
  await until(S(0)); await play(fade(c2), ...(sbox ? [fade(sbox)] : []), ...say('SEARCH:  "slow"', C.pink));
  const c4 = card('R4  A boring book. Slow, slow, slow.', Y2, OR);
  await until(S(1)); await play(fade(c4), ...say('ANOTHER READER:  "boring"', OR));
  await until(S(2)); await play(...say('slow  ↔  boring:  A CONNECTION?', C.amber));

  // 3-9 same context
  await until(S(3)); await play(new M.Indicate(c2, { color: C.pink }), new M.Indicate(c4, { color: OR }), ...say('REVIEWS 2 AND 4'));
  const rowA = [['a', C.muted], ['slow', C.pink], ['book', C.muted]].map(([w, c], j) => pill(w, c, P ? 22 : 18).moveTo([CX + (j - 1) * DX, RA, 0]));
  const rowB = [['a', C.muted], ['boring', OR], ['book', C.muted]].map(([w, c], j) => pill(w, c, P ? 22 : 18).moveTo([CX + (j - 1) * DX, RB, 0]));
  await until(S(4)); await play(fade(new M.VGroup(...rowA)), ...say('R2:  a slow book', C.pink));
  await until(S(5)); await play(fade(new M.VGroup(...rowB)), ...say('R4:  a boring book', OR));
  await until(S(6)); await play(new M.Indicate(rowA[1], { color: C.pink }), new M.Indicate(rowB[1], { color: OR }), ...say('SIDE BY SIDE'));
  const bw = P ? 1.9 : 1.5, top = RA + (P ? 0.5 : 0.42), bot = RB - (P ? 0.5 : 0.42);
  const gapBox = new M.VGroup(
    new M.Line({ start: [CX - bw / 2, top, 0], end: [CX + bw / 2, top, 0], color: C.amber, strokeWidth: 2 }),
    new M.Line({ start: [CX + bw / 2, top, 0], end: [CX + bw / 2, bot, 0], color: C.amber, strokeWidth: 2 }),
    new M.Line({ start: [CX + bw / 2, bot, 0], end: [CX - bw / 2, bot, 0], color: C.amber, strokeWidth: 2 }),
    new M.Line({ start: [CX - bw / 2, bot, 0], end: [CX - bw / 2, top, 0], color: C.amber, strokeWidth: 2 }));
  await until(S(7)); await play(new M.Create(gapBox), ...say('a  ___  book', C.amber));
  await until(S(8)); await play(new M.Indicate(rowA[0]), new M.Indicate(rowA[2]), new M.Indicate(rowB[0]), new M.Indicate(rowB[2]), ...say('CONTEXT = THE WORDS AROUND A WORD', C.violet));
  await until(S(9)); await play(...say('SIMILAR CONTEXT → SOMETHING IN COMMON', C.green));

  // 10-16 the map
  const u = P ? 1.15 : 0.85, ox = CX + 0.5 * u, oy = P ? -2.6 : -1.75;
  const m = (x, y) => [ox + x * u, oy + y * u, 0];
  // the map: a frame around the plotting area, first with unnamed glowing points
  const mapF = new M.RoundedRectangle({ width: 6.6 * u, height: 5.0 * u, cornerRadius: 0.2, color: C.line, strokeWidth: 2 });
  mapF.setFill(C.card, 0.35); mapF.moveTo(m(-0.5, 1.0));
  const glow = [[1, 3, C.cyan], [2, 3, C.cyan], [2, -1, C.green], [-2, -1, C.pink], [-3, -1, OR]].map(([x, y, c]) => {
    const h = new M.Dot({ point: m(x, y), radius: 0.22, color: c }); h.setFill(c, 0.2);
    return new M.VGroup(h, new M.Dot({ point: m(x, y), radius: 0.09, color: c })); });
  await until(S(10)); await play(out(new M.VGroup(c2, c4, ...rowA, ...rowB, gapBox, ...(sbox ? [sbox] : []))), fade(mapF), ...say('A MAP: RELATED WORDS SIT NEAR', C.amber));
  await until(S(11)); await play(new M.LaggedStart(glow.map(fade), { lagRatio: 0.2, runTime: 1.4 }), ...say('WORDS = GLOWING POINTS'));
  const tsz = P ? 16 : 14;
  const xAx = new M.Line({ start: m(-3.6, 0), end: m(2.6, 0), color: C.muted, strokeWidth: 2 });
  const yAx = new M.Line({ start: m(0, -1.5), end: m(0, 3.5), color: C.muted, strokeWidth: 2 });
  const xt = [-3, -2, -1, 1, 2].map(v => new M.VGroup(new M.Line({ start: [m(v, 0)[0], oy - 0.06, 0], end: [m(v, 0)[0], oy + 0.06, 0], color: C.muted }), lab(String(v), tsz, C.muted, m(v, 0)[0], oy - 0.25)));
  const yt = [-1, 1, 2, 3].map(v => new M.VGroup(new M.Line({ start: [ox - 0.06, m(0, v)[1], 0], end: [ox + 0.06, m(0, v)[1], 0], color: C.muted }), lab(String(v), tsz, C.muted, ox - 0.25, m(0, v)[1])));
  const zero = lab('0', tsz, C.muted, ox - 0.22, oy - 0.25);
  await until(S(12)); await play(out(new M.VGroup(...glow)), new M.Create(xAx), new M.Create(yAx), fade(new M.VGroup(...xt, ...yt, zero)), ...say('TWO NUMBER LINES CROSS AT 0'));
  await until(S(13)); await play(new M.Indicate(xAx, { color: C.amber }), ...say('1ST NUMBER: LEFT → RIGHT', C.amber));
  await until(S(14)); await play(new M.Indicate(yAx, { color: C.violet }), ...say('2ND NUMBER: BOTTOM → TOP', C.violet));
  await until(S(15)); await play(...say('EACH WORD = TWO NUMBERS'));
  await until(S(16)); await play(...say('COORDINATES', C.green));

  // 17-25 place the words
  function point(w, x, y, c, dy = 0.3) {
    const p = m(x, y);
    const halo = new M.Dot({ point: p, radius: 0.22, color: c }); halo.setFill(c, 0.2);
    const d = new M.Dot({ point: p, radius: 0.09, color: c });
    const t = lab(w, P ? 18 : 15, c, p[0], p[1] + dy * (P ? 1.2 : 1), false);
    return new M.VGroup(halo, d, t);
  }
  const path = (pts, c = C.amber) => new M.VGroup(...pts.slice(1).map((q, i) => new M.Line({ start: m(...pts[i]), end: m(...q), color: c, strokeWidth: 3 })));
  const coords = [];
  const list = () => fbox(coords.length ? coords : [], C.cyan);
  const pPlot = point('plot', 1, 3, C.cyan), pEnd = point('ending', 2, 3, C.cyan);
  const pGreat = point('great', 2, -1, C.green, -0.3), pSlow = point('slow', -2, -1, C.pink, -0.3), pBor = point('boring', -3, -1, OR, -0.3);
  const steps1 = path([[0, 0], [1, 0], [1, 3]]);
  await until(S(17)); await play(new M.Create(steps1), ...say('plot: 1 RIGHT, 3 UP', C.cyan));
  await play(fade(pPlot));
  coords.push(['plot   (1, 3)', C.cyan]);
  await until(S(18)); await play(out(steps1), ...list(), ...say('plot = (1, 3)', C.cyan));
  coords.push(['ending (2, 3)', C.cyan]);
  await until(S(19)); await play(fade(pEnd), ...list(), ...say('ending = (2, 3)', C.cyan));
  coords.push(['great  (2, −1)', C.green]);
  await until(S(20)); await play(fade(pGreat), ...list(), ...say('great = (2, −1)', C.green));
  const steps2 = path([[0, 0], [-2, 0], [-2, -1]]);
  coords.push(['slow   (−2, −1)', C.pink]);
  await until(S(21)); await play(new M.Create(steps2), ...say('slow = (−2, −1)', C.pink));
  await play(fade(pSlow), ...list());
  await until(S(22)); await play(new M.Indicate(steps2, { color: C.amber }), ...say('NEGATIVE = LEFT OR DOWN', C.amber));
  coords.push(['boring (−3, −1)', OR]);
  await until(S(23)); await play(out(steps2), fade(pBor), ...list(), ...say('boring = (−3, −1)', OR));
  await until(S(24)); await play(...say('A COMPUTER LEARNS THESE FROM HOW WORDS ARE USED', C.violet));
  await until(S(25)); await play(...say('WORD EMBEDDING = A WORD AS LEARNED NUMBERS', C.green));

  // 26-33 easy distances
  await until(S(26)); await play(...say('WHAT DO THE NUMBERS TELL US?', C.amber));
  const seg = (a, b, c = C.amber) => new M.Line({ start: m(...a), end: m(...b), color: c, strokeWidth: 4 });
  const l1 = seg([1, 3], [2, 3]);
  await until(S(27)); await play(new M.Create(l1), ...say('plot — ending', C.cyan));
  await until(S(28)); await play(new M.Indicate(l1, { color: C.amber }), ...say('SAME HEIGHT, 1 STEP APART'));
  const d1 = lab('1', 18, C.amber, m(1.5, 3)[0], m(1.5, 3)[1] - 0.28);
  await until(S(29)); await play(fade(d1), ...fbox(['distance', ['plot – ending = 1', C.cyan]], C.amber), ...say('DISTANCE = 1', C.amber));
  const l2 = seg([-3, -1], [-2, -1]);
  await until(S(30)); await play(new M.Create(l2), ...say('slow — boring', C.pink));
  const d2 = lab('1', 18, C.amber, m(-2.5, -1)[0], m(-2.5, -1)[1] + 0.28);
  await until(S(31)); await play(fade(d2), ...fbox(['distance', ['plot – ending = 1', C.cyan], ['slow – boring = 1', C.pink]], C.amber), ...say('ALSO DISTANCE 1', C.amber));
  const l3 = seg([-2, -1], [2, -1], C.green);
  await until(S(32)); await play(new M.Create(l3), ...say('great — slow: 4 STEPS', C.green));
  const d3 = lab('4', 18, C.green, m(0, -1)[0] + 0.2, m(0, -1)[1] + 0.25);
  await until(S(33)); await play(fade(d3), ...fbox(['distance', ['plot – ending = 1', C.cyan], ['slow – boring = 1', C.pink], ['great – slow  = 4', C.green]], C.amber), ...say('DISTANCE = 4', C.green));

  // 34-43 a slanted distance
  await until(S(34)); await play(out(new M.VGroup(l1, l2, l3, d1, d2, d3)), ...say('DIFFERENT HEIGHT AND SIDE?', C.violet));
  const hyp = seg([-2, -1], [1, 3], C.amber);
  await until(S(35)); await play(new M.Create(hyp), ...say('LINE: slow → plot', C.amber));
  const across = new M.DashedLine({ start: m(-2, -1), end: m(1, -1), color: C.cyan });
  const upL = new M.DashedLine({ start: m(1, -1), end: m(1, 3), color: C.violet });
  const t3 = lab('3', 18, C.cyan, m(-0.5, -1)[0], m(-0.5, -1)[1] - 0.25), t4 = lab('4', 18, C.violet, m(1, 1)[0] + 0.22, m(1, 1)[1]);
  await until(S(36)); await play(new M.Create(across), new M.Create(upL), fade(t3), fade(t4), ...say('3 RIGHT, 4 UP', C.violet));
  await until(S(37)); await play(new M.Indicate(hyp, { color: C.amber }), ...say('WE WANT THE STRAIGHT LINE', C.amber));
  await until(S(38)); await play(...fbox([['3 × 3 = 9', C.cyan]], C.amber), ...say('3 × 3 = 9', C.cyan));
  await until(S(39)); await play(...fbox([['3 × 3 = 9', C.cyan], ['4 × 4 = 16', C.violet]], C.amber), ...say('4 × 4 = 16', C.violet));
  await until(S(40)); await play(...fbox([['3 × 3 = 9', C.cyan], ['4 × 4 = 16', C.violet], '9 + 16 = 25'], C.amber), ...say('9 + 16 = 25'));
  await until(S(41)); await play(...fbox(['9 + 16 = 25', ['? × ? = 25', C.amber]], C.amber), ...say('WHICH NUMBER × ITSELF = 25?', C.amber));
  const t5 = lab('5', 20, C.amber, m(-0.5, 1)[0] - 0.25, m(-0.5, 1)[1] + 0.15);
  await until(S(42)); await play(fade(t5), ...fbox(['9 + 16 = 25', ['5 × 5 = 25', C.amber], ['distance = 5', C.amber]], C.amber), ...say('DISTANCE = 5', C.amber));
  await until(S(43)); await play(...fbox(['√25 = 5'], C.amber), ...say('SQUARE ROOT:  √25 = 5', C.green));

  // 44-48 the rule and what it gives
  await until(S(44)); await play(...say('THE RULE IN ONE LINE', C.amber));
  await until(S(45)); await play(...fbox([['distance =', C.amber], '√(across² + up²)', ['= √(3² + 4²) = 5', C.muted]], C.amber));
  await until(S(46)); await play(...fbox(['bag of words:', ['  all words equally far', C.muted], 'embeddings:', ['  distances 1, 4, 5', C.green]], C.green), ...say('DIFFERENT WORDS, DIFFERENT DISTANCES', C.green));
  await until(S(47)); await play(...say('REAL EMBEDDINGS: HUNDREDS OF NUMBERS', C.violet));
  await until(S(48)); await play(...say('SEARCH: CLOSE POINTS → RELATED WORDS', C.cyan));

  // 49-54 the trap
  await until(S(49)); await play(out(new M.VGroup(hyp, across, upL, t3, t4, t5)), ...fbox([['a  slow  book', C.pink]], C.pink), ...say('BACK TO:  a slow book', C.pink));
  await until(S(50)); await play(...fbox([['a  slow  book', C.pink], ['a  great book', C.green]], C.amber), ...say('R1:  a great book', C.green));
  await until(S(51)); await play(new M.Indicate(pGreat, { color: C.green }), new M.Indicate(pSlow, { color: C.pink }), ...say('SAME CONTEXT, OPPOSITE FEELINGS', C.amber));
  await until(S(52)); await play(...say('NEAR DOES NOT MEAN SAME MEANING', C.pink));
  await until(S(53)); await play(...say('NEXT: A COMPUTER LEARNS THE COORDINATES', C.violet));
  await until(S(54)); await play(...fbox([['word embedding =', C.green], 'numbers from how', 'people use a word'], C.green), ...say('WORD → NUMBERS → PLACE ON A MAP', C.green));
}

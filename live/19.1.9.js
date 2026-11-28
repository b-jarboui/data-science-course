// 19.1.9 Subword tokenization: building words from smaller pieces.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const OR = '#fb923c';
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.45, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.2, 0] : [4.3, -0.4, 0];
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

  // pair-count bars (in the box area)
  let barsNow = null;
  function bars(list, color = C.amber) {
    const [gx, gy] = BOXP, gw = P ? 6.8 : 3.9, gh = P ? 1.8 : 2.2, base = gy - gh / 2 + (P ? 0.1 : 0);
    const step = gw / list.length, bw = step * 0.62;
    const parts = [];
    list.forEach(([name, v], k) => {
      const x = gx - gw / 2 + step * (k + 0.5), h = v / 12 * gh, c = k === 0 ? color : C.muted;
      const r = new M.Rectangle({ width: bw, height: h, color: c, strokeWidth: 1 }); r.setFill(c, k === 0 ? 0.85 : 0.5); r.moveTo([x, base + h / 2, 0]);
      parts.push(r, lab(String(v), P ? 17 : 15, C.ink, x, base + h + 0.2), lab(name, P ? 15 : 14, c === C.muted ? C.ink : c, x, base - 0.24));
    });
    const g = new M.VGroup(...parts);
    const a = [fade(g)]; if (barsNow) a.push(out(barsNow)); barsNow = g;
    a.push(...fbox([]));
    return a;
  }
  const barsOff = () => { const a = barsNow ? [out(barsNow)] : []; barsNow = null; return a; };

  // letter tiles: each letter has a slot, a merged piece covers several slots
  const PIT = P ? 0.78 : 0.6, X0 = P ? -1.5 : CX - 1.3;
  const RY = P ? [1.4, 0.3, -0.8, -1.9, -3.0] : [1.0, 0.2, -0.6, -1.4, -2.2];
  const WC = { slow: C.pink, plot: C.cyan, loved: C.violet, great: C.green, idea: OR, slowly: C.pink };
  function tile(s, j, y, c) {
    const k = s.length, x = X0 + (j + (k - 1) / 2) * PIT;
    const r = new M.RoundedRectangle({ width: k * PIT - 0.08, height: P ? 0.66 : 0.5, cornerRadius: 0.08, color: c, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    return new M.VGroup(r, lab(s, P ? 22 : 18, C.ink, x, y));
  }
  const rows = {};
  function makeRow(w, y, pieces) {
    let j = 0;
    rows[w] = { y, pieces: (pieces || w.split('')).map(s => { const p = { s, j, g: tile(s, j, y, WC[w]) }; j += s.length; return p; }) };
    return rows[w].pieces.map(p => p.g);
  }
  function merge(w, a, b) {
    const R = rows[w], ps = R.pieces;
    const i = ps.findIndex((p, k) => p.s === a && ps[k + 1] && ps[k + 1].s === b);
    if (i < 0) return [];
    const p1 = ps[i], p2 = ps[i + 1];
    const anims = [new M.Transform(p1.g, tile(a + b, p1.j, R.y, WC[w])), out(p2.g)];
    p1.s = a + b; ps.splice(i + 1, 1);
    return anims;
  }
  const piece = (w, s) => rows[w].pieces.find(p => p.s === s).g;
  const lettersAt = (w, idx) => idx.map(k => rows[w].pieces[k].g);
  const ind = (objs, c = C.amber) => objs.map(o => new M.Indicate(o, { color: c }));
  const rowAll = w => rows[w].pieces.map(p => p.g);

  // 0-3 a new word
  const cw = P ? 7.4 : 6.0, CY = P ? -1.4 : RY[0];
  const cr = new M.RoundedRectangle({ width: cw, height: P ? 1.4 : 1.0, cornerRadius: 0.14, color: C.muted, strokeWidth: 2 });
  cr.setFill(C.card, 0.95); cr.moveTo([CX, CY, 0]);
  const ctag = lab('NEW REVIEW', P ? 16 : 15, C.muted, CX, CY + (P ? 0.4 : 0.25), false);
  const ctxt = lab('The story moves slowly.', P ? 22 : 19, C.ink, CX, CY - (P ? 0.15 : 0.12), false);
  const ctx = new M.VGroup(ctag, ctxt);
  await until(S(0)); await play(fade(new M.VGroup(cr, ctx)), ...say('A NEW REVIEW ARRIVES'));
  const sly = pill('slowly', C.pink, P ? 30 : 22).moveTo([CX, P ? -3.4 : RY[2], 0]);
  await until(S(1)); await play(fade(sly), ...say('NEW WORD:  slowly', C.pink));
  await until(S(2)); await play(...fbox(['in R1 – R6:', ['slow    ✓ (6 times)', C.pink], ['slowly  ✗ never', C.muted]], C.pink), ...say('NEVER SEEN BEFORE', C.muted));
  await until(S(3)); await play(...say('BUILD IT FROM PIECES WE KNOW?', C.amber));

  // 4-10 slow, plot, loved as letters; join l + o
  const RY3 = P ? [-0.4, -1.9, -3.4] : RY;   // phone: the first three words use the whole height
  const wordP = ['slow', 'plot', 'loved'].map((w, i) => { const p = pill(w, WC[w], P ? 22 : 18); p.moveTo([X0 + p.getWidth() / 2 - 0.25, RY3[i], 0]); return p; });
  await until(S(4)); await play(out(new M.VGroup(cr, ctx, sly)), ...fbox([]), new M.LaggedStart(wordP.map(fade), { lagRatio: 0.2, runTime: 1 }), ...say('slow,  plot,  loved'));
  const t3 = ['slow', 'plot', 'loved'].map((w, i) => makeRow(w, RY3[i]));
  await until(S(5)); await play(out(new M.VGroup(...wordP)), new M.LaggedStart(t3.flat().map(fade), { lagRatio: 0.05, runTime: 1.2 }), ...say('EACH WORD = A ROW OF LETTERS'));
  const loIdx = { slow: [1, 2], plot: [1, 2], loved: [0, 1] };
  await until(S(6)); await play(...ind([...lettersAt('slow', loIdx.slow), ...lettersAt('plot', loIdx.plot), ...lettersAt('loved', loIdx.loved)]), ...say('ALL THREE HAVE  l o  SIDE BY SIDE', C.amber));
  await until(S(7)); await play(...merge('slow', 'l', 'o'), ...merge('plot', 'l', 'o'), ...merge('loved', 'l', 'o'), ...say('JOIN  l + o  INTO ONE PIECE', C.amber));
  await until(S(8)); await play(...ind([piece('slow', 'lo'), piece('plot', 'lo'), piece('loved', 'lo')]), ...say('ONE PIECE, USED IN 3 WORDS', C.green));
  await until(S(9)); await play(...say('SUBWORD = A PIECE SMALLER THAN A WORD', C.violet));
  await until(S(10)); await play(...say('SUBWORD TOKENIZATION', C.violet));

  // 11-14 all 43 tokens as letters
  await until(S(11)); await play(...say('WHICH LETTERS DO WE JOIN?', C.amber));
  const five = ['slow', 'plot', 'loved', 'great', 'idea'], cnt = { slow: 6, plot: 4, loved: 2, great: 6, idea: 1 };
  const oldTiles = ['slow', 'plot', 'loved'].flatMap(rowAll);
  const whole = five.map((w, i) => { const p = pill(w, WC[w], P ? 22 : 18); p.moveTo([X0 + p.getWidth() / 2 - 0.25, RY[i], 0]); return p; });
  const times = five.map((w, i) => lab('×' + cnt[w], P ? 20 : 17, WC[w], X0 - (P ? 1.05 : 0.9), RY[i]));
  await until(S(12)); await play(out(new M.VGroup(...oldTiles)), fade(new M.VGroup(...whole, ...times)),
    ...fbox(['43 tokens, e.g.', 'a 9   great 6   slow 6', 'book 5   plot 4  ...'], C.cyan), ...say('ALL 43 TOKENS FROM 6 REVIEWS'));
  const tiles5 = five.map((w, i) => makeRow(w, RY[i]));
  await until(S(13)); await play(out(new M.VGroup(...whole)), fade(new M.VGroup(...tiles5.flat())), ...fbox(['every word → letters', ['pieces: 148', C.amber]], C.amber), ...say('EVERY WORD → SINGLE LETTERS'));
  await until(S(14)); await play(...ind(rowAll('great').concat(rowAll('idea')), C.muted), ...say('JOIN ONLY INSIDE A WORD, NEVER ACROSS', C.muted));

  // 15-22 count l + o
  await until(S(15)); await play(...say('COUNT EVERY NEIGHBOUR PAIR', C.amber));
  await until(S(16)); await play(...ind([...lettersAt('slow', loIdx.slow), ...lettersAt('plot', loIdx.plot), ...lettersAt('loved', loIdx.loved)]), ...say('PAIR:  l + o', C.amber));
  await until(S(17)); await play(...ind(lettersAt('slow', loIdx.slow), C.pink), ...fbox(['l + o', ['slow  ×6 →  6', C.pink]], C.amber));
  await until(S(18)); await play(...ind(lettersAt('plot', loIdx.plot), C.cyan), ...fbox(['l + o', ['slow  ×6 →  6', C.pink], ['plot  ×4 → +4', C.cyan]], C.amber));
  await until(S(19)); await play(...ind(lettersAt('loved', loIdx.loved), C.violet), ...fbox(['l + o', ['slow  ×6 →  6', C.pink], ['plot  ×4 → +4', C.cyan], ['loved ×2 → +2', C.violet]], C.amber));
  await until(S(20)); await play(...fbox(['l + o', ['6 + 4 + 2 = 12', C.amber]], C.amber), ...say('l + o:  12 TIMES', C.amber));
  const R1 = [['l+o', 12], ['e+a', 7], ['g+r', 6], ['s+l', 6], ['o+w', 6], ['b+o', 6]];
  await until(S(21)); await play(...bars(R1), ...say('COMPARE WITH ALL OTHER PAIRS'));
  await until(S(22)); await play(new M.Indicate(barsNow.submobjects[0], { color: C.amber }), ...say('l + o  IS THE LARGEST', C.amber));

  // 23-28 merge 1
  await until(S(23)); await play(...merge('slow', 'l', 'o'), ...merge('plot', 'l', 'o'), ...merge('loved', 'l', 'o'), ...say('JOIN  l o  EVERYWHERE', C.amber));
  await until(S(24)); await play(...say('JOINING TWO PIECES = A MERGE', C.violet));
  await until(S(25)); await play(...ind(rowAll('slow'), C.pink), ...say('slow  =  s | lo | w', C.pink));
  await until(S(26)); await play(...ind(rowAll('plot'), C.cyan), ...say('plot  =  p | lo | t', C.cyan));
  await until(S(27)); await play(...ind(rowAll('loved'), C.violet), ...say('loved  =  lo | v | e | d', C.violet));
  await until(S(28)); await play(...barsOff(), ...fbox(['merge 1: 12 pairs → 12 pieces', ['pieces: 148 → 136', C.amber]], C.amber), ...say('12 FEWER PIECES', C.green));

  // 29-36 merge 2: e + a
  const R2 = [['e+a', 7], ['g+r', 6], ['r+e', 6], ['s+lo', 6], ['lo+w', 6], ['b+o', 6]];
  await until(S(29)); await play(...bars(R2, C.green), ...say('COUNT AGAIN, WITH THE NEW PIECES'));
  await until(S(30)); await play(...ind([...lettersAt('great', [2, 3]), ...lettersAt('idea', [2, 3])], C.green), ...say('e + a  IN  great  AND  idea', C.green));
  await until(S(31)); await play(...ind(rowAll('great'), C.green), ...ind(rowAll('idea'), OR), ...say('great ×6,  idea ×1', C.green));
  await until(S(32)); await play(...say('6 + 1 = 7', C.green));
  await until(S(33)); await play(...merge('great', 'e', 'a'), ...merge('idea', 'e', 'a'), new M.Indicate(barsNow.submobjects[0], { color: C.green }), ...say('LARGEST → MERGE  e a', C.green));
  await until(S(34)); await play(...ind(rowAll('great'), C.green), ...say('great  =  g | r | ea | t', C.green));
  await until(S(35)); await play(...ind(rowAll('idea'), OR), ...say('idea  =  i | d | ea', OR));
  await until(S(36)); await play(...barsOff(), ...fbox(['merge 2: 7 fewer', ['pieces: 136 → 129', C.amber]], C.amber), ...say('7 FEWER PIECES', C.green));

  // 37-42 merge 3: a tie
  const R3 = [['s+lo', 6], ['g+r', 6], ['r+ea', 6], ['ea+t', 6], ['lo+w', 6], ['b+o', 6]];
  await until(S(37)); await play(...bars(R3, C.pink), ...say('MERGE 3: COUNT AGAIN', C.violet));
  await until(S(38)); await play(new M.LaggedStart(barsNow.submobjects.filter((_, k) => k % 3 === 0).map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.15, runTime: 1.2 }), ...say('A TIE: SEVERAL PAIRS HAVE 6', C.amber));
  await until(S(39)); await play(...say('EQUAL COUNTS → WE NEED A RULE TO PICK', C.muted));
  await until(S(40)); await play(...merge('slow', 's', 'lo'), ...say('WE PICK  s + lo  →  slo', C.pink));
  await until(S(41)); await play(...ind(rowAll('slow'), C.pink), ...say('slow  =  slo | w', C.pink));
  await until(S(42)); await play(...barsOff(), ...fbox(['merge 3: 6 fewer', ['pieces: 129 → 123', C.amber]], C.amber), ...say('6 FEWER PIECES', C.green));

  // 43-47 faster; whole words become pieces
  await until(S(43)); await play(...fbox(['pieces', '148 → 136 → 129', ['→ 123 → 117 → ...', C.amber]], C.amber), ...say('MORE MERGES: FEWER AND FEWER PIECES', C.violet));
  await until(S(44)); await play(...merge('slow', 'slo', 'w'), ...say('slo + w  →  slow = ONE PIECE', C.pink));
  const gr = rows.great, gFirst = gr.pieces[0];
  const gAn = [new M.Transform(gFirst.g, tile('great', 0, gr.y, C.green)), ...gr.pieces.slice(1).map(p => out(p.g))];
  gr.pieces = [{ s: 'great', j: 0, g: gFirst.g }];
  await until(S(45)); await play(...gAn, ...say('great  →  ONE PIECE TOO', C.green));
  await until(S(46)); await play(...say('EACH LETTER IS STORED IN 1 BYTE', C.muted));
  await until(S(47)); await play(...say('BYTE-PAIR ENCODING  (BPE)', C.violet));

  // 48-49 rule
  await until(S(48)); await play(...say('THE RULE IN ONE LINE', C.amber));
  await until(S(49)); await play(...fbox([['next merge =', C.amber], 'the neighbour pair', 'with the largest count'], C.amber));

  // 50-51 slowly
  const tail = rowAll('great').concat(rowAll('idea'), [times[3], times[4]]);
  await until(S(50)); await play(out(new M.VGroup(...tail)), ...say('BACK TO:  slowly', C.pink));
  const sw = makeRow('slowly', RY[4], ['slow', 'l', 'y']);
  await until(S(51)); await play(new M.LaggedStart(sw.map(fade), { lagRatio: 0.3, runTime: 1.2 }), ...fbox([['single letters are kept too:', C.ink], ['slowly = slow | l | y', C.pink]], C.pink), ...say('slowly  =  slow | l | y', C.pink));
  await until(S(52)); await play(...say('NEW WORDS WITHOUT A HUGE WORD LIST', C.green));
  await until(S(53)); await play(...ind([piece('plot', 'lo'), piece('loved', 'lo')], C.amber), ...say('BUT  lo  HAS NO MEANING OF ITS OWN', C.muted));
  await until(S(54)); await play(...fbox([]), ...say('JOIN THE MOST FREQUENT PAIRS, AGAIN AND AGAIN', C.violet));
}

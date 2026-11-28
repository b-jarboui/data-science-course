// 19.1.10 Contextual embeddings: how nearby words change a word's representation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const OR = '#fb923c';
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.45, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.4, 0] : [4.3, -0.3, 0];
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

  // a sentence as a row of word pills
  const WC = { slow: C.pink, boring: OR, great: C.green, and: C.muted, but: C.muted };
  function sentence(words, y) {
    const ps = words.map(w => pill(w, WC[w], P ? 24 : 18));
    const ws = ps.map(p => p.getWidth()), gap = 0.25, tot = ws.reduce((s, w) => s + w, 0) + gap * (ws.length - 1);
    let x = CX - tot / 2; ps.forEach((p, i) => { p.moveTo([x + ws[i] / 2, y, 0]); x += ws[i] + gap; });
    return ps;
  }

  // 0-4 two sentences
  const YA = P ? -0.5 : 0.6, YB = P ? -3.0 : -0.9;
  // two reader cards: the name on top, the sentence inside (sentence appears when the voice reads it)
  const readerCard = (name, y, c) => {
    const r = new M.RoundedRectangle({ width: P ? 7.2 : 6.4, height: P ? 1.8 : 1.3, cornerRadius: 0.16, color: c, strokeWidth: 2 });
    r.setFill(C.card, 0.6); r.moveTo([CX, y - (P ? 0.25 : 0.2), -0.02]);
    const t = lab(name, P ? 17 : 15, c, CX - (P ? 2.6 : 2.4), y + (P ? 0.45 : 0.3), false);
    return new M.VGroup(r, t);
  };
  const rd1 = readerCard('reader 1', YA, OR), rd2 = readerCard('reader 2', YB, C.green);
  await until(S(0)); await play(fade(rd1), fade(rd2), ...say('TWO READERS DESCRIBE A BOOK'));
  const sA = sentence(['slow', 'and', 'boring'], YA - (P ? 0.35 : 0.3));
  await until(S(1)); await play(new M.LaggedStart(sA.map(fade), { lagRatio: 0.25, runTime: 1 }), ...say('READER 1:  slow and boring', OR));
  const sB = sentence(['slow', 'but', 'great'], YB - (P ? 0.35 : 0.3));
  await until(S(2)); await play(new M.LaggedStart(sB.map(fade), { lagRatio: 0.25, runTime: 1 }), ...say('READER 2:  slow but great', C.green));
  await until(S(3)); await play(new M.Indicate(sA[0], { color: C.pink }), new M.Indicate(sB[0], { color: C.pink }), ...say('SAME WORD, DIFFERENT EXPERIENCE', C.amber));
  await until(S(4)); await play(...say('CAN  slow  GET TWO DIFFERENT POINTS?', C.violet));

  // 5-13 the word map
  const u = P ? 1.2 : 0.9, ox = CX + 0.5 * u, oy = P ? -1.6 : -0.4;
  const m = (x, y) => [ox + x * u, oy + y * u, 0];
  const tsz = P ? 16 : 14;
  const xAx = new M.Line({ start: m(-3.6, 0), end: m(2.6, 0), color: C.muted, strokeWidth: 2 });
  const yAx = new M.Line({ start: m(0, -2), end: m(0, 1), color: C.muted, strokeWidth: 2 });
  const ticks = [-3, -2, -1, 1, 2].map(v => new M.VGroup(new M.Line({ start: [m(v, 0)[0], oy - 0.06, 0], end: [m(v, 0)[0], oy + 0.06, 0], color: C.muted }), lab(String(v), tsz, C.muted, m(v, 0)[0], oy + 0.22)));
  const yt = new M.VGroup(new M.Line({ start: [ox - 0.06, m(0, -1)[1], 0], end: [ox + 0.06, m(0, -1)[1], 0], color: C.muted }),
    lab('−1', tsz, C.muted, ox + 0.4, m(0, -1)[1] - 0.38));
  function point(w, x, y, c, dy = -0.32, r = 0.09) {
    const p = m(x, y);
    const halo = new M.Dot({ point: p, radius: 0.22, color: c }); halo.setFill(c, 0.2);
    return new M.VGroup(halo, new M.Dot({ point: p, radius: r, color: c }), lab(w, P ? 17 : 15, c, p[0], p[1] + dy * (P ? 1.15 : 1), false));
  }
  await until(S(5)); await play(out(new M.VGroup(...sA, ...sB, rd1, rd2)), new M.Create(xAx), new M.Create(yAx), fade(new M.VGroup(...ticks, yt)), ...say('BACK TO OUR WORD MAP'));
  const pSlow = point('slow', -2, -1, C.pink), pBor = point('boring', -3, -1, OR), pGreat = point('great', 2, -1, C.green);
  await until(S(6)); await play(fade(pSlow), ...say('slow = (−2, −1)', C.pink));
  await until(S(7)); await play(fade(pBor), ...say('boring = (−3, −1)', OR));
  await until(S(8)); await play(fade(pGreat), ...say('great = (2, −1)', C.green));
  await until(S(9)); await play(...fbox([['slow   (−2, −1)', C.pink], ['boring (−3, −1)', OR], ['great  (2, −1)', C.green]]), ...say('COORDINATES = THE WORD\'S NUMBERS'));
  await until(S(10)); await play(...say('WORD EMBEDDING', C.green));
  await until(S(11)); await play(new M.Indicate(pSlow, { color: C.pink }), ...say('slow: SAME POINT IN EVERY SENTENCE', C.muted));
  await until(S(12)); await play(...say('NEARBY WORDS SHOW HOW slow IS USED', C.amber));
  await until(S(13)); await play(...say('slow BORROWS FROM ANOTHER WORD', C.violet));

  // 14-28 sentence 1: halfway towards boring
  const YS = P ? 0.9 : 1.0;
  let row = sentence(['slow', 'and', 'boring'], YS);
  await until(S(14)); await play(fade(new M.VGroup(...row)), ...fbox([]), ...say('SENTENCE 1:  slow and boring', OR));
  await until(S(15)); await play(new M.Indicate(row[2], { color: OR }), ...say('boring GIVES INFORMATION TO slow', OR));
  const l1 = new M.Line({ start: m(-3, -1), end: m(-2, -1), color: C.amber, strokeWidth: 5 });
  await until(S(16)); await play(new M.Create(l1), ...say('LINE: slow — boring', C.amber));
  const mover = new M.Dot({ point: m(-2, -1), radius: 0.13, color: C.amber });
  const c1 = point('slow + boring', -2.5, -1, C.amber, 0.38, 0.12);
  await until(S(17)); await play(fade(mover), ...say('MOVE slow HALFWAY TO boring', C.amber));
  await play(new M.Transform(mover, new M.Dot({ point: m(-2.5, -1), radius: 0.13, color: C.amber })));
  await until(S(18)); await play(out(mover), fade(c1), ...say('NEW POINT: INFO FROM BOTH WORDS', C.amber));
  await until(S(19)); await play(new M.Indicate(c1, { color: C.amber }), ...say('CONTEXTUAL EMBEDDING', C.violet));
  await until(S(20)); await play(...say('ITS COORDINATES, ONE AT A TIME'));
  await until(S(21)); await play(...fbox(['1st number', ['slow:   −2', C.pink]], C.amber));
  await until(S(22)); await play(...fbox(['1st number', ['slow:   −2', C.pink], ['boring: −3', OR]], C.amber));
  await until(S(23)); await play(...fbox(['1st number', ['slow:   −2', C.pink], ['boring: −3', OR], '−2 + (−3) = −5'], C.amber));
  await until(S(24)); await play(...fbox(['1st number', '−2 + (−3) = −5', ['−5 ÷ 2 = −2.5', C.amber]], C.amber));
  await until(S(25)); await play(...fbox(['2nd number', ['slow:   −1', C.pink], ['boring: −1', OR]], C.violet), ...say('SAME 2ND NUMBER: −1', C.violet));
  await until(S(26)); await play(...fbox(['2nd number', '−1 + (−1) = −2'], C.violet));
  await until(S(27)); await play(...fbox(['2nd number', '−1 + (−1) = −2', ['−2 ÷ 2 = −1', C.violet]], C.violet));
  await until(S(28)); await play(...fbox(['slow in sentence 1', ['= (−2.5, −1)', C.amber]], C.amber), new M.Indicate(c1, { color: C.amber }), ...say('NEW POINT (−2.5, −1)', C.amber));

  // 29-39 sentence 2: halfway towards great
  const row2 = sentence(['slow', 'but', 'great'], YS);
  await until(S(29)); await play(out(new M.VGroup(...row)), fade(new M.VGroup(...row2)), out(l1), ...say('SENTENCE 2:  slow but great', C.green));
  row = row2;
  await until(S(30)); await play(new M.Indicate(pSlow, { color: C.pink }), ...fbox([['slow  (−2, −1)', C.pink]], C.pink), ...say('START AGAIN FROM (−2, −1)', C.pink));
  await until(S(31)); await play(new M.Indicate(row[2], { color: C.green }), ...say('NOW great GIVES INFORMATION', C.green));
  await until(S(32)); await play(new M.Indicate(pGreat, { color: C.green }), ...fbox([['slow  (−2, −1)', C.pink], ['great (2, −1)', C.green]], C.green));
  const l2 = new M.Line({ start: m(-2, -1), end: m(2, -1), color: C.green, strokeWidth: 5 });
  const mover2 = new M.Dot({ point: m(-2, -1), radius: 0.13, color: C.green });
  const c2 = point('slow + great', 0, -1, C.green, 0.38, 0.12);
  await until(S(33)); await play(new M.Create(l2), fade(mover2), ...say('MOVE slow HALFWAY TO great', C.green));
  await play(new M.Transform(mover2, new M.Dot({ point: m(0, -1), radius: 0.13, color: C.green })));
  await until(S(34)); await play(out(mover2), fade(c2), ...say('ITS COORDINATES?', C.green));
  await until(S(35)); await play(...fbox(['1st number', '−2 + 2 = 0'], C.green));
  await until(S(36)); await play(...fbox(['1st number', '−2 + 2 = 0', ['0 ÷ 2 = 0', C.green]], C.green));
  await until(S(37)); await play(...fbox(['2nd number', '−1 + (−1) = −2'], C.violet));
  await until(S(38)); await play(...fbox(['2nd number', '−1 + (−1) = −2', ['−2 ÷ 2 = −1', C.violet]], C.violet));
  await until(S(39)); await play(...fbox(['slow in sentence 2', ['= (0, −1)', C.green]], C.green), new M.Indicate(c2, { color: C.green }), ...say('NEW POINT (0, −1)', C.green));

  // 40-43 two contextual points, one word
  await until(S(40)); await play(out(l2), out(new M.VGroup(...row)), ...fbox([['sentence 1: (−2.5, −1)', C.amber], ['sentence 2: (0, −1)', C.green]], C.cyan), ...say('BOTH NEW POINTS ON ONE MAP'));
  const yb = m(0, -1)[1] - (P ? 0.75 : 0.7);
  const gapL = new M.VGroup(
    new M.Line({ start: [m(-2.5, 0)[0], yb, 0], end: [m(0, 0)[0], yb, 0], color: C.amber, strokeWidth: 3 }),
    new M.Line({ start: [m(-2.5, 0)[0], yb - 0.1, 0], end: [m(-2.5, 0)[0], yb + 0.1, 0], color: C.amber, strokeWidth: 3 }),
    new M.Line({ start: [m(0, 0)[0], yb - 0.1, 0], end: [m(0, 0)[0], yb + 0.1, 0], color: C.amber, strokeWidth: 3 }),
    lab('2.5 apart', P ? 18 : 15, C.amber, m(-1.25, 0)[0], yb - 0.28, false));
  await until(S(41)); await play(new M.Create(gapL), ...say('SAME WORD slow, 2.5 STEPS APART', C.amber));
  await until(S(42)); await play(new M.Indicate(pSlow, { color: C.pink }), ...say('ORIGINAL EMBEDDING: NEVER CHANGES', C.pink));
  await until(S(43)); await play(new M.Indicate(c1, { color: C.amber }), new M.Indicate(c2, { color: C.green }), ...say('ONLY THE CONTEXTUAL ONE CHANGES', C.violet));

  // 44-45 the rule
  await until(S(44)); await play(...say('THE RULE IN ONE LINE', C.amber));
  await until(S(45)); await play(...fbox([['new number =', C.amber], '½ × own number', '+ ½ × other word\'s'], C.amber));

  // 46-49 many words, learned amounts: attention
  const mapAll = new M.VGroup(xAx, yAx, ...ticks, yt, pSlow, pBor, pGreat, c1, c2, gapL);
  const YM = P ? -2.2 : -0.5;
  const big = sentence(['slow', 'and', 'boring'], YM);
  const arcTo = (i, w) => {
    const a = big[0].getCenter(), b = big[i].getCenter(), r = (b[0] - a[0]) / 2;
    const arc = new M.Arc({ radius: r, startAngle: Math.PI, angle: Math.PI, color: C.violet, strokeWidth: w });
    arc.moveTo([(a[0] + b[0]) / 2, a[1] - 0.3 - r / 2, 0]); return arc;
  };
  const a1 = arcTo(1, 3), a2 = arcTo(2, 3);
  await until(S(46)); await play(out(mapAll), ...fbox([]), fade(new M.VGroup(...big)), ...say('REAL MODELS: INFO FROM MANY WORDS', C.violet));
  await play(new M.Create(a1), new M.Create(a2));
  const a1b = arcTo(1, 1.5), a2b = arcTo(2, 7);
  await until(S(47)); await play(new M.Transform(a1, a1b), new M.Transform(a2, a2b), ...say('NOT EVERY WORD GIVES THE SAME AMOUNT', C.amber));
  await until(S(48)); await play(new M.Indicate(a2, { color: C.amber }), ...say('THE MODEL LEARNS HOW MUCH TO TAKE', C.green));
  await until(S(49)); await play(...say('ATTENTION  →  NEXT CHAPTER', C.violet));

  // 50-53
  await until(S(50)); await play(...say('UNDERSTAND, ANSWER QUESTIONS, TRANSLATE', C.green));
  await until(S(51)); await play(...say('HALFWAY RULE = ONLY A SMALL EXAMPLE', C.muted));
  await until(S(52)); await play(...say('EQUAL MIXING CANNOT CAPTURE EVERYTHING', C.pink));
  await until(S(53)); await play(...fbox([['contextual embedding =', C.violet], 'the word itself', '+ its context'], C.violet), ...say('WORD + CONTEXT → ITS MEANING HERE', C.violet));
}

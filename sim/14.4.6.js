// 14.4.6 Try it: content-based recommendation with topic labels.
// The learner taps topic cells to change what each book is about, taps Ana's stars to change her favourite,
// makes random bookshops, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const BOOKS = ['Trail', 'River', 'Clues', 'Castle', 'Island'];
  const UNREAD = ['River', 'Castle', 'Island'];
  const COL = { Trail: C.green, River: '#2dd4bf', Clues: C.amber, Castle: C.violet, Island: '#fde047' };
  const POOL = ['Adventure', 'Nature', 'Mystery', 'Crime', 'History', 'Science'];
  const SHORT = ['Adv', 'Nat', 'Mys', 'Cri', 'His', 'Sci'];
  const START = { Trail: ['Adventure', 'Nature'], River: ['Adventure', 'Nature'], Clues: ['Mystery', 'Crime'],
    Castle: ['Mystery', 'History'], Island: ['Adventure'] };
  const START_STARS = { Trail: 4, Clues: 2 };
  const fresh = () => Object.fromEntries(BOOKS.map(b => [b, new Set(START[b])]));
  let tp = fresh(), stars = { ...START_STARS }, sel = 'River';

  const svg = s('svg', { viewBox: '0 0 700 400' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: books with similar topics'),
    h('p', { class: 'sub' }, 'Each row is a book. A lit cell is one of its topics. Ana’s favourite is her book with the most stars. Each unrated book gets a score: shared topics ÷ different topics.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('New data (random)', () => {
            BOOKS.forEach(b => { const n = rnd(1, 3), set = new Set(); while (set.size < n) set.add(POOL[rnd(0, POOL.length - 1)]); tp[b] = set; });
            stars = { Trail: rnd(1, 5), Clues: rnd(1, 5) };
            draw();
          }, 'go'),
          btn('Start again', () => { tp = fresh(); stars = { ...START_STARS }; sel = 'River'; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const r2 = x => Math.round(x * 100) / 100;
  const fav = () => (stars.Clues > stars.Trail ? 'Clues' : 'Trail');
  const list = set => POOL.filter(t => set.has(t)).join(', ') || 'no topics';
  function jac(a, b) {
    const A = tp[a], B = tp[b];
    const shared = POOL.filter(t => A.has(t) && B.has(t)), all = POOL.filter(t => A.has(t) || B.has(t));
    return { shared, all, score: all.length ? shared.length / all.length : 0 };
  }

  const chal = challenges(ch, [
    { text: 'Tap one cell in the Castle row so that Castle’s score is bigger than 0.',
      check: st => st.scores.Castle > 0, why: 'Yes! Castle now shares a topic with the favourite book, so its score is above zero.' },
    { text: 'Make Island’s score exactly 1.',
      check: st => st.scores.Island === 1, why: 'Right: a score of 1 needs exactly the same topics. Every topic is shared and none is extra.' },
    { text: 'Give River an extra topic that the favourite book does not have. What happens to River’s score?',
      check: st => st.riverExtra && st.scores.River > 0 && st.scores.River < 1,
      why: 'It goes down: the extra topic is not shared, so the number of different topics grows.' },
    { text: 'Tap Ana’s stars until Clues is her favourite book. Look at the new order.',
      check: st => st.fav === 'Clues', why: 'Every score now compares with Clues, so the order changes: the suggestions follow what Ana likes most.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const NAME_W = NARROW ? 70 : 110, STAR_W = NARROW ? 40 : 70, SCORE_W = NARROW ? 52 : 130;
  const X_T = NAME_W + STAR_W, SX0 = VW - 10 - SCORE_W, CW = (SX0 - X_T) / POOL.length;
  const HY = 30, RH = 52, rowY = r => 62 + r * RH, RANK_Y = rowY(4) + RH / 2 + 30;
  svg.setAttribute('viewBox', `0 0 ${VW} 400`);
  const colX = c => X_T + (c + 0.5) * CW;

  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('click', e => {
    const p = toSvg(e), r = Math.floor((p.y - (rowY(0) - RH / 2)) / RH);
    if (r < 0 || r >= BOOKS.length) return;
    const b = BOOKS[r];
    if (p.x >= X_T && p.x < SX0) {
      const t = POOL[Math.min(POOL.length - 1, Math.floor((p.x - X_T) / CW))];
      if (tp[b].has(t)) tp[b].delete(t); else tp[b].add(t);
      if (UNREAD.includes(b)) sel = b;
    } else if (p.x >= NAME_W && p.x < X_T && b in stars) stars[b] = stars[b] % 5 + 1;
    else if (UNREAD.includes(b)) sel = b;
    draw();
  });

  function draw() {
    const f = fav(), k = [], res = {};
    UNREAD.forEach(b => { res[b] = jac(f, b); });
    const txt = (x, y, str, fill, size, anchor = 'middle', bold = false, mono = true) =>
      s('text', { x, y, fill, 'font-size': size * F, 'text-anchor': anchor, 'font-weight': bold ? 700 : 400, 'font-family': mono ? 'Consolas' : 'Segoe UI, Arial' }, str);

    // header
    POOL.forEach((t, c) => k.push(txt(colX(c), HY, NARROW ? SHORT[c] : t, C.muted, NARROW ? 11 : 12, 'middle', false, NARROW)));
    k.push(txt(NAME_W + STAR_W / 2, HY, NARROW ? 'Ana' : 'Ana ★', C.cyan, 12, 'middle', true),
      txt(SX0 + SCORE_W / 2, HY, 'score', C.muted, 12));

    BOOKS.forEach((b, r) => {
      const y = rowY(r);
      if (b === sel) k.push(s('rect', { x: 4, y: y - RH / 2 + 2, width: VW - 8, height: RH - 4, rx: 8, fill: '#ffffff', 'fill-opacity': .05 }));
      if (b === f) k.push(s('rect', { x: 4, y: y - RH / 2 + 2, width: VW - 8, height: RH - 4, rx: 8, fill: 'none', stroke: C.green, 'stroke-width': 2 }));
      k.push(txt(10, y + 5, b, COL[b], 15, 'start', true, false));
      k.push(b in stars ? txt(NAME_W + STAR_W / 2, y + 5, `${stars[b]}★`, C.amber, 15, 'middle', true) : txt(NAME_W + STAR_W / 2, y + 5, '—', C.muted, 15));
      POOL.forEach((t, c) => {
        const on = tp[b].has(t), shared = on && b !== f && UNREAD.includes(b) && tp[f].has(t);
        k.push(s('rect', { x: colX(c) - CW / 2 + 3, y: y - 15, width: CW - 6, height: 30, rx: 15,
          fill: on ? COL[b] : 'none', 'fill-opacity': on ? .85 : 0, stroke: shared ? C.green : on ? COL[b] : C.line, 'stroke-width': shared ? 3 : 1.5 }));
        if (on) k.push(txt(colX(c), y + 4, SHORT[c], C.bg, 11, 'middle', true));
      });
      if (UNREAD.includes(b)) {
        const v = res[b].score, col = v >= 1 ? C.green : v > 0 ? C.amber : C.pink, bw = (SCORE_W - 12) * v;
        k.push(s('rect', { x: SX0 + 6, y: y + 9, width: SCORE_W - 12, height: 6, rx: 3, fill: C.line }),
          s('rect', { x: SX0 + 6, y: y + 9, width: bw, height: 6, rx: 3, fill: col }),
          txt(SX0 + SCORE_W / 2, y + 2, fmt(r2(v)), col, 15, 'middle', true));
      } else k.push(txt(SX0 + SCORE_W / 2, y + 5, b === f ? (NARROW ? 'FAV' : 'FAVOURITE') : 'rated', b === f ? C.green : C.muted, 13, 'middle', b === f));
    });

    // recommendation order: highest score first (ties keep the bookshop order)
    const order = UNREAD.slice().sort((a, b) => res[b].score - res[a].score);
    k.push(txt(10, RANK_Y, 'Recommend, first to last:', C.muted, 13, 'start', false, false));
    const pw = (VW - 20 - 16) / 3;
    order.forEach((b, i) => {
      const x = 10 + i * (pw + 8);
      k.push(s('rect', { x, y: RANK_Y + 10, width: pw, height: 36, rx: 18, fill: C.bg, stroke: COL[b], 'stroke-width': 2 }),
        txt(x + pw / 2, RANK_Y + 33, `${i + 1}. ${b} ${fmt(r2(res[b].score))}`, COL[b], NARROW ? 11 : 14, 'middle', true));
    });
    svg.replaceChildren(...k);

    const R = res[sel];
    fbox(box, [
      [`favourite = ${f} (${stars[f]}★)`, COL[f]],
      `${f}: ${list(tp[f])}`,
      [`${sel}: ${list(tp[sel])}`, COL[sel]],
      [`shared    = ${R.shared.length}${R.shared.length ? '  (' + R.shared.join(', ') + ')' : ''}`, C.green],
      `different = ${R.all.length}`,
      [R.all.length ? `score = ${R.shared.length} ÷ ${R.all.length} = ${fmt(r2(R.score))}` : 'score = 0  (no topics at all)', C.amber]]);
    note.textContent = `First recommendation: ${order[0]}. Tap a cell to add or remove a topic, tap Ana’s stars to change them, tap River, Castle or Island to see its calculation.`;

    const scores = Object.fromEntries(UNREAD.map(b => [b, r2(res[b].score)]));
    chal.update({ scores, fav: f, riverExtra: [...tp.River].some(t => !tp[f].has(t)) });
  }
  draw();
  return () => {};
}

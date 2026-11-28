// 20.3.8 KV caching: keep each token's key and value, compute only the new card (live lesson, script.v6.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const WORDS = ['The', 'library', 'will', 'open', 'at', 'ten', '.'];
  const CX = P ? 0 : -2.0, SP = P ? 1.08 : 1.4, TW = P ? 1.0 : 1.2, TH = P ? 0.5 : 0.42, CW = P ? 1.0 : 1.1, CH = P ? 0.62 : 0.5;
  const TOKY = P ? 2.3 : 0.7, CARDY = P ? 1.45 : 0.05, QY = CARDY - (P ? 1.3 : 1.0);
  const PILL = P ? [0, 3.6, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, -4.3, 0] : [4.85, -1.6, 0];
  const BASE = P ? -2.9 : -2.6, PITCH = P ? 0.34 : 0.27, BWC = P ? 0.6 : 0.55, HEADY = BASE + 6 * PITCH + 0.35;
  const NCX = P ? [-2.6, -1.8, -1.0] : [-5.6, -4.8, -4.0], WCX = P ? [1.0, 1.8, 2.6] : [-1.6, -0.8, 0];
  const KW = CW * 0.4, KH = CH * 0.7;
  const X = i => CX + (i - 3) * SP;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

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

  // token cards (prompt muted, written tokens cyan)
  function makeTok(i) {
    const r = new M.RoundedRectangle({ width: TW, height: TH, cornerRadius: 0.1, color: i < 4 ? C.muted : C.cyan, strokeWidth: 2 });
    r.setFill(C.card, 0.9); r.moveTo([X(i), TOKY, 0]);
    const t = T(WORDS[i], P ? 17 : 18, i < 4 ? C.ink : C.cyan, false, true);
    if (t.getWidth() > TW - 0.12) t.scale((TW - 0.12) / t.getWidth());
    t.moveTo([X(i), TOKY, 0]);
    return new M.VGroup(r, t);
  }

  // key-value cards: [outline, K, V], each part on its own so it can be recoloured or indicated
  function part(x, y, ch, color, ht = KH, size = P ? 18 : 18) {
    const r = new M.Rectangle({ width: KW, height: ht, color, strokeWidth: 1.5 }); r.setFill(color, 0.28); r.moveTo([x, y, 0]);
    const t = T(ch, size, color, true, true); t.moveTo([x, y, 0]);
    return new M.VGroup(r, t);
  }
  const kPart = (i, y = CARDY, ht = KH, size) => part(X(i) - CW * 0.23, y, 'K', C.violet, ht, size);
  const vPart = (i, y = CARDY, ht = KH, size) => part(X(i) + CW * 0.23, y, 'V', C.green, ht, size);
  function outline(i, color, y = CARDY, ht = CH) {
    const o = new M.RoundedRectangle({ width: CW, height: ht, cornerRadius: 0.08, color, strokeWidth: 2 }); o.moveTo([X(i), y, 0]); return o;
  }
  function makeCard(i, color = C.amber, y = CARDY, ht = CH, size) {
    const c = [outline(i, color, y, ht), kPart(i, y, ht * 0.7, size), vPart(i, y, ht * 0.7, size)]; c.i = i; return c;
  }
  let cards = [], fresh = [];
  const cardIn = cs => new M.LaggedStart(cs.map(c => new M.LaggedStart(c.map(m => new M.FadeIn(m)), { lagRatio: 0 })), { lagRatio: 0.25, runTime: 1.4 });
  function addCards(ids) { const cs = ids.map(i => makeCard(i)); cards.push(...cs); fresh.push(...cs); return cardIn(cs); }
  function cardsOut() { const g = new M.VGroup(...cards.flat()); cards = []; fresh = []; return new M.FadeOut(g); }
  const storeFresh = () => fresh.splice(0).map(c => new M.Transform(c[0], outline(c.i, C.cyan)));

  // block chart: one block = one card computed
  const blk = (x, j, color = C.amber) => { const b = new M.Rectangle({ width: BWC, height: PITCH * 0.8, color, strokeWidth: 1 }); b.setFill(color, 0.82); b.moveTo([x, BASE + (j + 0.5) * PITCH, 0]); return b; };
  const column = (x, n) => Array.from({ length: n }, (_, j) => blk(x, j));
  const colIn = col => new M.LaggedStart(col.map(b => new M.FadeIn(b)), { lagRatio: 0.15, runTime: 1.2 });
  function chartFrame(xs, title, color) {
    const fl = new M.Line({ start: [xs[0] - BWC, BASE, 0], end: [xs[2] + BWC, BASE, 0], color: C.muted, strokeWidth: 2 });
    const head = T(title, P ? 17 : 18, color, true, true); head.moveTo([xs[1], HEADY, 0]);
    const labs = xs.map((x, k) => { const t = T(String(k + 1), P ? 16 : 16, C.muted, true); t.moveTo([x, BASE - 0.25, 0]); return t; });
    const st = T('step', P ? 16 : 16, C.muted); st.moveTo([xs[0] - BWC / 2 - 0.15 - st.getWidth() / 2, BASE - 0.25, 0]); labs.push(st);
    return new M.VGroup(fl, head, ...labs);
  }

  // mask arrows above the tokens: an arc that lands on the token it looks at
  function arcTo(a, b, hgt, color) {
    const y0 = TOKY + TH / 2 + 0.04, xa = X(a), xb = X(b), c = Math.abs(xb - xa);
    const r = (c * c / 4 + hgt * hgt) / (2 * hgt), th = Math.asin(c / 2 / r);
    const arc = new M.Arc({ radius: r, startAngle: Math.PI / 2 - th, angle: 2 * th, color, strokeWidth: 2.5 });
    arc.moveTo([(xa + xb) / 2, y0 + hgt / 2, 0]);
    return [arc, new M.Dot({ point: [xb, y0, 0], radius: 0.06, color })];
  }

  // 0-2 the three tokens from the first lesson
  let tok = WORDS.map((_, i) => makeTok(i));
  await until(S(0)); await play(new M.LaggedStart(tok.map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 2.0 }), ...fbox(['3 new tokens:', ['at · ten · .', C.cyan], 'one prediction each']), ...say('3 NEW TOKENS:  at · ten · .'));
  const brackets = [];
  for (let k = 4; k < 7; k++) {
    const y = TOKY - 0.75 - 0.3 * (k - 4);
    brackets.push(new M.Line({ start: [X(0) - TW / 2, y, 0], end: [X(k), y, 0], color: C.cyan, strokeWidth: 2 }),
      new M.Arrow({ start: [X(k), y, 0], end: [X(k), TOKY - TH / 2 - 0.02, 0], color: C.cyan, strokeWidth: 2 }));
  }
  await until(S(1)); await play(new M.LaggedStart(brackets.map(b => new M.Create(b)), { lagRatio: 0.3, runTime: 2.2 }), ...say('EACH NEW TOKEN: PREDICTED FROM THE WHOLE PREFIX'));
  await until(S(2)); await play(...say('DOES IT REDO ALL THE WORK EVERY TIME?', C.amber));

  // 3-9 recall attention on the prefix "The library will open"
  await until(S(3)); await play(new M.FadeOut(new M.VGroup(...brackets, tok[4], tok[5], tok[6])), ...say('RECALL: HOW ATTENTION READS A PREFIX', C.violet));
  const ks = [0, 1, 2, 3].map(i => kPart(i)), vs = [0, 1, 2, 3].map(i => vPart(i));
  await until(S(4)); await play(new M.LaggedStart(ks.map((k, i) => new M.LaggedStart([new M.FadeIn(k), new M.FadeIn(vs[i])], { lagRatio: 0.3 })), { lagRatio: 0.25, runTime: 1.8 }), ...fbox(['each token gets', ['a key K', C.violet], ['and a value V', C.green]]), ...say('EACH TOKEN → A KEY (K) AND A VALUE (V)'));
  await until(S(5)); await play(new M.LaggedStart(ks.map(k => new M.Indicate(k, { color: C.violet })), { lagRatio: 0.2, runTime: 1.6 }), ...fbox([['key K:', C.violet], 'what the token offers'], C.violet), ...say('KEY = WHAT THE TOKEN OFFERS', C.violet));
  await until(S(6)); await play(new M.LaggedStart(vs.map(v => new M.Indicate(v, { color: C.green })), { lagRatio: 0.2, runTime: 1.6 }), ...fbox([['value V:', C.green], 'the information', 'it passes on'], C.green), ...say('VALUE = THE INFORMATION IT PASSES ON', C.green));
  const q = part(X(3), QY, 'Q', C.amber);
  await until(S(7)); await play(new M.FadeIn(q), new M.Flash(q, { color: C.amber }), ...fbox([['query Q:', C.amber], 'what the newest', 'token looks for'], C.amber), ...say('NEWEST TOKEN “open”: QUERY = WHAT IT LOOKS FOR', C.amber));
  const link = (i, w) => new M.Line({ start: [X(3), QY + KH / 2, 0], end: [X(i) - CW * 0.23, CARDY - KH / 2, 0], color: C.amber, strokeWidth: w });
  const links = [0, 1, 2, 3].map(i => link(i, 2));
  await until(S(8)); await play(new M.LaggedStart(links.map(l => new M.Create(l)), { lagRatio: 0.3, runTime: 1.8 }), ...say('COMPARE ITS QUERY WITH EVERY KEY', C.amber));
  const W = [1, 6, 2, 4], MIXP = [X(3) + (P ? 0.9 : 1.0), QY, 0];
  const pieces = vs.map((_, i) => { const r = new M.Rectangle({ width: KW, height: KH, color: C.green, strokeWidth: 1.5 }); r.setFill(C.green, W[i] * 0.07); r.moveTo(MIXP); return r; });
  const mixLab = T('mix', P ? 17 : 17, C.green); mixLab.moveTo([MIXP[0], QY - 0.38, 0]);
  await until(S(9)); await play(...links.map((l, i) => new M.Transform(l, link(i, 1 + W[i]))),
    ...vs.map((v, i) => new M.ReplacementTransform(v.copy(), pieces[i])), new M.FadeIn(mixLab), ...fbox(['mix the values:', ['more from the', C.green], ['best matches', C.green]], C.green), ...say('MIX THE VALUES: BEST MATCHES COUNT MOST', C.green));

  // 10 one card per token
  const outs = [0, 1, 2, 3].map(i => outline(i, C.cyan));
  await until(S(10)); await play(new M.FadeOut(new M.VGroup(q, ...links, ...pieces, mixLab)),
    new M.LaggedStart(outs.map(o => new M.Create(o)), { lagRatio: 0.2, runTime: 1.4 }), ...say('KEY + VALUE = ONE CARD UNDER ITS TOKEN'));

  // 11-16 no shortcut: every step computes all cards again
  await until(S(11)); await play(new M.FadeOut(new M.VGroup(...ks, ...vs, ...outs)),
    new M.LaggedStart(tok.slice(0, 4).map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.6 }), ...say('STEP 1: PREFIX = 4 TOKENS'));
  const ncFrame = chartFrame(NCX, 'NO CACHE', C.amber), ncCols = [];
  await until(S(12));
  ncCols.push(column(NCX[0], 4));
  await play(new M.FadeIn(ncFrame), addCards([0, 1, 2, 3]), colIn(ncCols[0]), ...fbox(['cards computed', ['4', C.amber]], C.amber), ...say('COMPUTE 4 KEY-VALUE CARDS', C.amber));
  await until(S(12) + 2.3);
  tok[4] = makeTok(4);
  await play(new M.FadeIn(tok[4]), new M.Flash(tok[4], { color: C.cyan }), ...say('PREDICT → “at”'));
  await until(S(13)); await play(cardsOut(), new M.LaggedStart(tok.slice(0, 5).map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.15, runTime: 1.6 }), ...say('STEP 2: PREFIX = 5 TOKENS'));
  await until(S(14));
  ncCols.push(column(NCX[1], 5));
  await play(addCards([0, 1, 2, 3, 4]), colIn(ncCols[1]), ...fbox(['cards computed', ['4 + 5 = 9', C.amber]], C.amber), ...say('NO SHORTCUT: ALL 5 CARDS AGAIN', C.pink));
  await until(S(15));
  tok[5] = makeTok(5);
  await play(cardsOut(), new M.FadeIn(tok[5]), new M.Flash(tok[5], { color: C.cyan }), ...say('STEP 3: 6 TOKENS → 6 CARDS'));
  ncCols.push(column(NCX[2], 6));
  await play(addCards([0, 1, 2, 3, 4, 5]), colIn(ncCols[2]), ...fbox(['cards computed', ['9 + 6 = 15', C.amber]], C.amber));
  tok[6] = makeTok(6);
  await play(new M.FadeIn(tok[6]), new M.Flash(tok[6], { color: C.cyan }));
  await until(S(16)); await play(new M.LaggedStart(ncCols.flat().map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.06, runTime: 2.4 }),
    ...fbox(['cards computed', ['4 + 5 + 6 = 15', C.amber]], C.amber), ...say('4 + 5 + 6 = 15 CARDS', C.amber));

  // 17-20 the first four cards never change: the mask
  await until(S(17));
  const same = ncCols.flatMap(col => col.slice(0, 4));
  same.forEach(b => { b.setFill(C.violet, 0.85); b.setColor(C.violet); });
  await play(new M.LaggedStart(cards.slice(0, 4).map(c => new M.Transform(c[0], outline(c.i, C.violet))), { lagRatio: 0.2, runTime: 1.2 }),
    new M.LaggedStart(same.map(b => new M.Indicate(b, { color: C.violet })), { lagRatio: 0.06, runTime: 2.0 }), ...say('“The library will open”: SAME 4 CARDS EVERY STEP', C.violet));
  await until(S(18)); await play(...say('WHY? REMEMBER THE MASK', C.amber));
  const ahead = arcTo(3, 4, 0.22, C.pink), cross = T('×', 26, C.pink, false, true);
  cross.moveTo([(X(3) + X(4)) / 2, TOKY + TH / 2 + 0.26, 0]);
  const arcs = [...arcTo(3, 2, 0.22, C.green), ...arcTo(3, 1, 0.38, C.green), ...arcTo(3, 0, 0.54, C.green), ...ahead, cross];
  await until(S(19)); await play(new M.LaggedStart(arcs.map(a => new M.FadeIn(a)), { lagRatio: 0.25, runTime: 2.4 }), ...say('A TOKEN LOOKS ONLY BACK, NEVER AHEAD', C.green));
  await until(S(20)); await play(new M.FadeOut(new M.VGroup(...arcs)), new M.Flash(tok[6], { color: C.cyan }),
    new M.LaggedStart(cards.slice(0, 4).map(c => new M.Indicate(c[0], { color: C.violet })), { lagRatio: 0.2, runTime: 1.6 }), ...say('NEW TOKEN AT THE END: OLD CARDS UNCHANGED', C.violet));

  // 21-26 keep the cards in a box
  const cacheBox = new M.RoundedRectangle({ width: X(6) - X(0) + CW + 0.2, height: CH + 0.24, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2 });
  cacheBox.moveTo([CX, CARDY, 0]);
  await until(S(21)); await play(cardsOut(), new M.FadeOut(new M.VGroup(tok[4], tok[5], tok[6])), new M.Create(cacheBox), ...say('KEEP THEM IN A BOX'));
  const wcFrame = chartFrame(WCX, 'WITH THE BOX', C.cyan), wcCols = [];
  await until(S(22));
  wcCols.push(column(WCX[0], 4));
  await play(new M.FadeIn(wcFrame), addCards([0, 1, 2, 3]), colIn(wcCols[0]), ...fbox(['no cache: 15', ['box:      4', C.amber]]), ...say('STEP 1: 4 CARDS INTO THE BOX'));
  for (const [i, s, tot] of [[4, 23, '4 + 1 = 5'], [5, 24, '4 + 1 + 1 = 6']]) {
    await until(S(s));
    tok[i] = makeTok(i);
    await play(new M.FadeIn(tok[i]), new M.Flash(tok[i], { color: C.cyan }), ...storeFresh(), ...say(`STEP ${i - 2}: ONLY THE CARD FOR “${WORDS[i]}”`));
    wcCols.push(column(WCX[i - 3], 1));
    await play(addCards([i]), colIn(wcCols[i - 3]), ...fbox(['no cache: 15', [`box:      ${tot}`, C.amber]]));
  }
  tok[6] = makeTok(6);
  await play(new M.FadeIn(tok[6]), new M.Flash(tok[6], { color: C.cyan }));
  await until(S(25)); await play(...storeFresh(), new M.LaggedStart(wcCols.flat().map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.12, runTime: 1.8 }),
    ...fbox(['no cache: 4+5+6 = 15', ['box:      4+1+1 = 6', C.amber]]), ...say('6 CARDS INSTEAD OF 15', C.amber));
  await until(S(26)); await play(new M.LaggedStart(tok.slice(4).map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.2, runTime: 1.4 }),
    ...fbox(['no cache: 4+5+6 = 15', 'box:      4+1+1 = 6', ['15 − 6 = 9 fewer', C.green]], C.green), ...say('9 FEWER, SAME ANSWER: “at ten .”', C.green));

  // 27-30 the name
  const kvLab = T('KV CACHE', P ? 18 : 18, C.cyan, true, true);
  kvLab.moveTo(P ? [0, CARDY - 0.65, 0] : [X(6) + CW / 2 + 0.85, CARDY, 0]);
  await until(S(27)); await play(new M.FadeIn(kvLab), new M.Indicate(cacheBox, { color: C.cyan }), ...say('KV CACHE:  K = KEY,  V = VALUE'));
  await until(S(28)); await play(...say('CACHE = RESULTS KEPT FOR REUSE', C.violet));
  await until(S(29)); await play(new M.Indicate(kvLab, { color: C.green }), ...say('USING IT = KV CACHING', C.green));
  await until(S(30)); await play(...fbox(['KV caching:', 'K and V once per token,', 'stored in the cache;', ['each step: only the', C.amber], ['new pair', C.amber]]));

  // 31-33 the saving grows with length
  const GX = s => P ? -3.15 + s * 0.9 : -6.0 + s * 1.0, GB = P ? 0.34 : 0.36, GU = P ? 0.22 : 0.13, GBASE = P ? -3.1 : -2.55, GHY = P ? 0.35 : -0.6, DX = GB / 2 + 0.02;
  const bar = (s, n, color, dx) => { const b = new M.Rectangle({ width: GB, height: n * GU, color, strokeWidth: 1 }); b.setFill(color, 0.75); b.moveTo([GX(s) + dx, GBASE + n * GU / 2, 0]); return b; };
  const barLab = (s, n, color, dx) => { const t = T(String(n), P ? 15 : 15, color, true); t.moveTo([GX(s) + dx, GBASE + n * GU + 0.18, 0]); return t; };
  const gFloor = new M.Line({ start: [GX(0) - 0.45, GBASE, 0], end: [GX(7) + 0.45, GBASE, 0], color: C.muted, strokeWidth: 2 });
  const gSteps = Array.from({ length: 8 }, (_, s) => { const t = T(String(s + 1), P ? 16 : 16, C.muted, true); t.moveTo([GX(s), GBASE - 0.25, 0]); return t; });
  const gHead = [['cards per step:', C.muted], ['no cache', C.pink], ['cache', C.cyan]].map(([w, c], j) => {
    const t = T(w, P ? 17 : 17, c); t.moveTo([(P ? [-2.2, 0.4, 2.5] : [-5.1, -2.9, -1.4])[j], GHY, 0]); return t; });
  await until(S(31)); await play(new M.FadeOut(new M.VGroup(ncFrame, wcFrame, ...ncCols.flat(), ...wcCols.flat())),
    new M.FadeIn(new M.VGroup(gFloor, ...gSteps, ...gHead)), ...fbox(['the saving grows', ['with length', C.green]], C.green), ...say('THE SAVING GROWS WITH LENGTH', C.green));
  const pinkBars = gSteps.map((_, s) => bar(s, 4 + s, C.pink, -DX)), pinkLabs = gSteps.map((_, s) => barLab(s, 4 + s, C.pink, -DX));
  await until(S(32)); await play(new M.LaggedStart(pinkBars.map((b, s) => new M.LaggedStart([new M.FadeIn(b), new M.FadeIn(pinkLabs[s])], { lagRatio: 0 })), { lagRatio: 0.25, runTime: 2.8 }),
    ...fbox(['no cache: the whole', ['prefix, every step', C.pink]], C.pink), ...say('NO CACHE: THE WHOLE PREFIX, EVERY STEP', C.pink));
  const cyanBars = gSteps.map((_, s) => bar(s, s ? 1 : 4, C.cyan, DX)), cyanLabs = gSteps.map((_, s) => barLab(s, s ? 1 : 4, C.cyan, DX));
  await until(S(33)); await play(new M.LaggedStart(cyanBars.map((b, s) => new M.LaggedStart([new M.FadeIn(b), new M.FadeIn(cyanLabs[s])], { lagRatio: 0 })), { lagRatio: 0.25, runTime: 2.4 }),
    ...fbox(['cache: 1 new card', ['per step', C.cyan]]), ...say('WITH A CACHE: 1 NEW CARD PER STEP'));

  // 34-36 what it is for
  await until(S(34)); await play(...say('WHAT IS IT FOR?', C.amber));
  await until(S(35)); await play(new M.LaggedStart(cyanBars.map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.15, runTime: 1.8 }), ...fbox(['long answers:', ['much faster', C.green]], C.green), ...say('LONG ANSWERS: MUCH FASTER', C.green));
  await until(S(36)); await play(...say('CHAT MODELS: ON ALMOST EVERY TIME'));

  // 37-42 the trap: memory
  await until(S(37)); await play(new M.FadeOut(new M.VGroup(gFloor, ...gSteps, ...gHead, ...pinkBars, ...pinkLabs, ...cyanBars, ...cyanLabs)), ...fbox(['the cache', ['is not free', C.pink]], C.pink), ...say('THE TRAP: THE CACHE IS NOT FREE', C.pink));
  const NSEG = P ? 28 : 32, SEGW = 0.25, MX0 = P ? -3.5 : -6.4, MY = P ? -2.4 : -2.4;
  const seg = (j, color) => { const r = new M.Rectangle({ width: SEGW * 0.8, height: 0.26, color, strokeWidth: 1 }); r.setFill(color, 0.85); r.moveTo([MX0 + (j + 0.5) * SEGW, MY, 0]); return r; };
  const meterBox = color => { const r = new M.Rectangle({ width: NSEG * SEGW + 0.12, height: 0.4, color, strokeWidth: 2 }); r.moveTo([MX0 + NSEG * SEGW / 2, MY, 0]); return r; };
  const meter = meterBox(C.muted), memLab = T('memory', 18, C.muted);
  memLab.moveTo(P ? [-2.85, -1.9, 0] : [-5.8, -1.98, 0]);
  const segs = [];
  const segsIn = (from, to, color) => { const a = []; for (let j = from; j < to; j++) { segs.push(seg(j, color)); a.push(new M.FadeIn(segs[j])); } return new M.LaggedStart(a, { lagRatio: 0.15, runTime: 1.4 }); };
  await until(S(38)); await play(new M.Create(meter), new M.FadeIn(memLab), ...say('IT COSTS MEMORY: WORKING STORAGE', C.pink));
  await until(S(39)); await play(new M.LaggedStart(cards.map(c => new M.Indicate(c[0], { color: C.cyan })), { lagRatio: 0.15, runTime: 1.4 }), segsIn(0, 6, C.cyan),
    ...fbox(['after 3 steps:', ['cache = 6 cards', C.cyan]]), ...say('AFTER 3 STEPS: 6 CARDS IN THE BOX'));
  await until(S(40)); await play(addCards([6]), segsIn(6, 7, C.amber), ...fbox(['cache = 6 + 1 = 7 cards', ['+1 card per token', C.amber]], C.amber), ...say('+1 CARD FOR EVERY TOKEN', C.amber));
  const LY = P ? [0.25, -0.4] : [-0.6, -1.15];
  const layerCards = LY.flatMap(y => WORDS.map((_, i) => makeCard(i, C.cyan, y, 0.5, P ? 15 : 15)));
  const dots = T('⋮', 22, C.muted, false, true); dots.moveTo([CX, P ? -0.95 : -1.62, 0]);
  await until(S(41)); await play(new M.LaggedStart(layerCards.map(c => new M.LaggedStart(c.map(m => new M.FadeIn(m)), { lagRatio: 0 })), { lagRatio: 0.08, runTime: 2.2 }),
    new M.FadeIn(dots), segsIn(7, 21, C.cyan), ...fbox(['cards = tokens × layers', ['here: 7 × 3 = 21', C.amber]], C.violet), ...say('LAYERS: A CARD PER TOKEN IN EVERY LAYER', C.violet));
  await until(S(42)); await play(segsIn(21, NSEG, C.pink), new M.Transform(meter, meterBox(C.pink)),
    ...fbox(['long chats × many users', ['→ memory full', C.pink]], C.pink), ...say('LONG CHATS + MANY USERS: MEMORY FULL', C.pink));

  // 43-44 the trade and the recap
  await until(S(43)); await play(...fbox([['speed:  6 cards, not 15', C.green], ['memory: every card kept', C.pink]], C.amber), ...say('KV CACHING TRADES MEMORY FOR SPEED', C.amber));
  await until(S(44)); await play(new M.Indicate(cacheBox, { color: C.green }),
    ...fbox(['KV caching:', 'K and V once per token', ['each step: only the', C.amber], ['new pair', C.amber]], C.green), ...say('STORE ONCE, COMPUTE ONLY THE NEW PAIR', C.green));
}

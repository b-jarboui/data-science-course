// 12.3.5 Stratified folds: the same mix of bike types in every fold.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const CARGO = [false, false, true, false, false, true];
  const PILL = P ? [0, 3.95, 0] : [0, 2.08, 0];
  const BOXP = P ? [0, -3.55, 0] : [4.6, -0.5, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19, lh = P ? 0.42 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };

  // ---------- tokens: circle = commuter, square = cargo ----------
  function shape(cargo, pos, r) {
    const s = cargo ? new M.Square({ sideLength: r * 1.75, color: C.cyan, strokeWidth: 3 }) : new M.Circle({ radius: r, color: C.cyan, strokeWidth: 3 });
    s.setFill(C.cyan, 0.22); s.moveTo(pos); return s;
  }
  function token(i, pos) {
    const sh = shape(CARGO[i], pos, 0.36);
    const tx = T(String(i + 1), P ? 17 : 18, C.ink, true); tx.moveTo(pos);
    return { sh, tx, cargo: CARGO[i], i };
  }
  const fadeTok = (t, out = false) => [out ? new M.FadeOut(t.sh) : new M.FadeIn(t.sh), out ? new M.FadeOut(t.tx) : new M.FadeIn(t.tx)];
  function move(t, pos, arc = -0.6) {
    const ns = shape(t.cargo, pos, 0.36);
    const nt = T(String(t.i + 1), P ? 17 : 18, C.ink, true); nt.moveTo(pos);
    return [new M.Transform(t.sh, ns, { pathArc: arc }), new M.Transform(t.tx, nt, { pathArc: arc })];
  }

  const ROWY = P ? 2.6 : 1.2;
  const rowPos = i => P ? [(i - 2.5) * 1.15, ROWY, 0] : [-4.6 + i * 1.1, ROWY, 0];
  const FC = P ? [[-1.95, 0.6], [1.95, 0.6]] : [[-3.75, -0.75], [-0.05, -0.75]];
  const FWD = P ? 3.6 : 3.4, FHT = P ? 1.5 : 1.6, SLOT = P ? 1.1 : 1.05;
  const slot = (k, j) => [FC[k][0] + (j - 1) * SLOT, FC[k][1], 0];
  function frame(k, col = C.violet, label = `FOLD ${k + 1}`) {
    const r = new M.RoundedRectangle({ width: FWD, height: FHT, cornerRadius: 0.18, color: col, strokeWidth: 2.5 });
    r.moveTo([FC[k][0], FC[k][1], 0]);
    const p = pill(label, col, P ? 16 : 15); p.moveTo([FC[k][0], FC[k][1] + FHT / 2 + 0.3, 0]);
    return { r, p };
  }

  // 0-3 two types
  const big = P ? [[-1.6, 0.6], [1.6, 0.6]] : [[-2.0, -0.3], [2.0, -0.3]];
  const icC = shape(false, [big[0][0], big[0][1], 0], 0.8), icK = shape(true, [big[1][0], big[1][1], 0], 0.8);
  const lbC = T('commuter', 19, C.cyan, true); lbC.moveTo([big[0][0], big[0][1] - 1.2, 0]);
  const lbK = T('cargo', 19, C.cyan, true); lbK.moveTo([big[1][0], big[1][1] - 1.2, 0]);
  const subC = T('everyday trips', 15, C.muted, true); subC.moveTo([big[0][0], big[0][1] - 1.55, 0]);
  const subK = T('heavy loads', 15, C.muted, true); subK.moveTo([big[1][0], big[1][1] - 1.55, 0]);
  const modelCard = new M.RoundedRectangle({ width: P ? 5.6 : 6.4, height: 1.7, cornerRadius: 0.2, color: C.cyan, strokeWidth: 2.5 });
  modelCard.setFill(C.card, 0.95); modelCard.moveTo([0, P ? 0.6 : -0.3, 0]);
  const modelT = T('PRICE MODEL', 22, C.cyan, true); modelT.moveTo([0, (P ? 0.6 : -0.3) + 0.35, 0]);
  const modelQ = T('bike → price?  how well does it do?', P ? 17 : 19, C.amber, true); modelQ.moveTo([0, (P ? 0.6 : -0.3) - 0.35, 0]);
  const model = new M.VGroup(modelCard, modelT, modelQ);
  await until(S(0)); await play(new M.FadeIn(model), ...say('TEST THE PRICE MODEL FAIRLY', C.cyan));
  await until(S(1)); await play(new M.FadeOut(model), new M.FadeIn(icC), new M.FadeIn(icK), new M.FadeIn(lbC), new M.FadeIn(lbK), ...say('TWO TYPES OF BIKES', C.cyan));
  await until(S(2)); await play(new M.FadeIn(subC), new M.Indicate(lbC, { color: C.amber }), ...say('COMMUTER = EVERYDAY TRIPS', C.cyan));
  await until(S(3)); await play(new M.FadeIn(subK), new M.Indicate(lbK, { color: C.amber }), ...say('CARGO = HEAVY LOADS', C.cyan));

  // 4-11 six bikes
  let toks = CARGO.map((_, i) => token(i, rowPos(i)));
  await until(S(4)); await play(new M.FadeOut(new M.VGroup(icC, icK, lbC, lbK, subC, subK)),
    new M.LaggedStart(toks.map(t => new M.FadeIn(t.sh)), { lagRatio: 0.12, runTime: 1.2 }), ...say('OUR 6 BIKES', C.cyan));
  await play(...toks.map(t => new M.FadeIn(t.tx)));
  const comm = [0, 1, 3, 4], carg = [2, 5];
  await until(S(5)); await play(...comm.map(i => new M.Indicate(toks[i].tx, { color: C.cyan })), ...say('BIKES 1, 2, 4, 5: COMMUTER', C.cyan));
  await until(S(6)); await play(...carg.map(i => new M.Indicate(toks[i].tx, { color: C.amber })), ...say('BIKES 3, 6: CARGO', C.amber));
  await until(S(7)); await play(...say('CIRCLE = COMMUTER · SQUARE = CARGO', C.cyan));
  await until(S(8)); await play(...comm.map(i => new M.Flash(toks[i].sh, { color: C.cyan })), ...say('4 CIRCLES · 2 SQUARES', C.cyan));
  await until(S(9)); await play(...carg.map(i => new M.Flash(toks[i].sh, { color: C.amber })), ...say('CARGO = LESS COMMON', C.amber));
  await until(S(10)); await play(...fbox([['cargo bikes', C.amber], '2 of 6'], C.amber));
  await until(S(11)); await play(...fbox([['cargo bikes', C.amber], '2 of 6', ['2 ÷ 6 = 1/3', C.amber]], C.amber), ...say('1 IN EVERY 3 = CARGO', C.amber));

  // 12-23 an unlucky split
  let F = [frame(0), frame(1)];
  await until(S(12)); await play(...dropBox(), new M.Create(F[0].r), new M.Create(F[1].r), ...say('2 GROUPS OF 3', C.violet));
  await until(S(13)); await play(new M.FadeIn(F[0].p), new M.FadeIn(F[1].p), ...say('EACH GROUP = A FOLD', C.violet));
  await until(S(14)); await play(...move(toks[0], slot(0, 0)), ...move(toks[2], slot(0, 1)), ...move(toks[5], slot(0, 2)), ...say('FOLD 1: BIKES 1, 3, 6', C.violet));
  await until(S(15)); await play(...move(toks[1], slot(1, 0)), ...move(toks[3], slot(1, 1)), ...move(toks[4], slot(1, 2)), ...say('FOLD 2: BIKES 2, 4, 5', C.violet));
  await until(S(16)); await play(new M.Indicate(F[0].p, { color: C.amber }), ...fbox([['fold 1', C.violet], '1 commuter', ['2 cargo', C.amber]], C.violet));
  await until(S(17)); await play(new M.Indicate(F[1].p, { color: C.amber }), ...fbox([['fold 2', C.violet], '3 commuter', ['0 cargo', C.pink]], C.violet));
  await until(S(18)); await play(...fbox([['size', C.ink], '3 bikes  =  3 bikes'], C.cyan), ...say('SAME SIZE', C.cyan));
  await until(S(19)); await play(...say('BUT A VERY DIFFERENT MIX', C.pink));
  await until(S(20)); await play(new M.Indicate(F[1].r, { color: C.pink }), ...fbox([['learn from fold 2', C.ink], ['sees NO cargo bike', C.pink]], C.pink));
  await until(S(21)); await play(new M.Indicate(F[0].r, { color: C.pink }), ...fbox([['learn from fold 1', C.ink], ['sees only 1 commuter', C.pink]], C.pink));
  await until(S(22)); await play(...say('HARD TO TEST BOTH TYPES', C.pink));
  await until(S(23)); await play(...dropBox(), ...say('CAN WE DIVIDE MORE CAREFULLY?', C.green));

  // 24-25 dealing cards
  await until(S(24));
  await play(new M.FadeOut(new M.VGroup(...toks.map(t => t.sh), ...toks.map(t => t.tx), F[0].r, F[0].p, F[1].r, F[1].p)), ...say('DEAL 2 TYPES OF CARDS TO 2 PLAYERS', C.cyan));
  const cardAt = (col, pos) => { const r = new M.RoundedRectangle({ width: 0.55, height: 0.8, cornerRadius: 0.08, color: col, strokeWidth: 2 }); r.setFill(col, 0.45); r.moveTo(pos); return r; };
  const deckX = P ? 0 : -1.9;
  const deckCols = [C.cyan, C.cyan, C.cyan, C.cyan, C.amber, C.amber];
  const cards = deckCols.map((c, k) => cardAt(c, [deckX + (k - 2.5) * 0.7, ROWY, 0]));
  const pl = [0, 1].map(k => { const t = T(`player ${k + 1}`, 17, C.violet, true); t.moveTo([FC[k][0], FC[k][1] - 0.85, 0]); return t; });
  await play(new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 1.0 }), new M.FadeIn(pl[0]), new M.FadeIn(pl[1]));
  const dealTo = [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]];
  await until(S(25));
  await play(new M.LaggedStart(cards.map((c, k) => { const [p, j] = dealTo[k]; return new M.Transform(c, cardAt(deckCols[k], [FC[p][0] + (j - 1) * 0.75, FC[p][1], 0]), { pathArc: -0.7 }); }), { lagRatio: 0.25, runTime: 2.2 }),
    ...say('EACH TYPE SHARED EQUALLY', C.green));

  // 26-35 stratified split
  toks = CARGO.map((_, i) => token(i, rowPos(i)));
  F = [frame(0), frame(1)];
  await until(S(26)); await play(new M.FadeOut(new M.VGroup(...cards, ...pl)), ...toks.flatMap(t => fadeTok(t)), ...say('SAME WITH OUR BIKES', C.green));
  await play(new M.Create(F[0].r), new M.Create(F[1].r), new M.FadeIn(F[0].p), new M.FadeIn(F[1].p));
  const sortX = P ? [-3.2, -2.1, -1.0, 0.1, 2.0, 3.1] : [-4.6, -3.6, -2.6, -1.6, 0.2, 1.2];
  const order = [0, 1, 3, 4, 2, 5];
  await until(S(27)); await play(...order.flatMap((i, k) => move(toks[i], [sortX[k], ROWY, 0], 0)), ...say('SEPARATE: 4 COMMUTER · 2 CARGO', C.cyan));
  await until(S(28)); await play(...move(toks[0], slot(0, 0)), ...move(toks[1], slot(0, 1)), ...move(toks[3], slot(1, 0)), ...move(toks[4], slot(1, 1)),
    ...say('2 COMMUTER BIKES EACH', C.cyan));
  await until(S(29)); await play(...move(toks[2], slot(0, 2)), ...move(toks[5], slot(1, 2)), ...say('1 CARGO BIKE EACH', C.amber));
  await until(S(30)); await play(new M.Indicate(F[0].p, { color: C.green }), ...fbox([['fold 1', C.violet], 'bikes 1, 2, 3'], C.violet));
  await until(S(31)); await play(new M.Indicate(F[1].p, { color: C.green }), ...fbox([['fold 2', C.violet], 'bikes 4, 5, 6'], C.violet));
  await until(S(32)); await play(...[0, 1, 3, 4].map(i => new M.Flash(toks[i].sh, { color: C.cyan })), ...[2, 5].map(i => new M.Flash(toks[i].sh, { color: C.amber })),
    ...fbox([['each fold', C.green], '2 circles + 1 square'], C.green));
  await until(S(33)); await play(...say('SAME MIX AS ALL OUR DATA', C.green));
  await until(S(34)); await play(...say('STRATIFICATION', C.green), ...fbox([['stratification:', C.green], 'keep each type share', 'nearly the same', 'in every fold'], C.green));
  await until(S(35)); await play(...say('STRATIFIED FOLDS', C.green));

  // 36-41 check the share
  await until(S(36)); await play(...say('CHECK THE CARGO SHARE', C.amber));
  await until(S(37)); await play(...fbox([['cargo share', C.amber], ['all:    2 ÷ 6 = 1/3', C.ink]], C.amber));
  await until(S(38)); await play(new M.Indicate(toks[2].tx, { color: C.amber }), ...fbox([['cargo share', C.amber], 'all:    2 ÷ 6 = 1/3', ['fold 1: 1 ÷ 3 = 1/3', C.green]], C.amber));
  await until(S(39)); await play(new M.Indicate(toks[5].tx, { color: C.amber }), ...fbox([['cargo share', C.amber], 'all:    2 ÷ 6 = 1/3', 'fold 1: 1 ÷ 3 = 1/3', ['fold 2: 1 ÷ 3 = 1/3', C.green]], C.amber));
  await until(S(40)); await play(...say('A SHORT FORMULA', C.cyan));
  await until(S(41)); await play(...fbox([['cargo share =', C.ink], ['cargo bikes', C.amber], ['÷ all bikes', C.cyan]], C.cyan));

  // 42-50 twelve bikes, three folds
  const TYPES12 = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
  const R12 = 0.2;
  const row12 = k => P ? [(k - 5.5) * 0.6, ROWY, 0] : [-5.2 + k * 0.6, ROWY, 0];
  const FC3 = P ? [[-2.55, 0.5], [0, 0.5], [2.55, 0.5]] : [[-4.6, -0.8], [-1.9, -0.8], [0.8, -0.8]];
  const slot3 = (f, j) => [FC3[f][0] + (j % 2 - 0.5) * 0.65, FC3[f][1] + (j < 2 ? 0.33 : -0.33), 0];
  const small = TYPES12.map((c, k) => shape(!!c, row12(k), R12));
  const frames3 = FC3.map((c, f) => {
    const r = new M.RoundedRectangle({ width: P ? 2.3 : 2.3, height: 1.6, cornerRadius: 0.16, color: C.violet, strokeWidth: 2.5 }); r.moveTo([c[0], c[1], 0]);
    const p = pill(`FOLD ${f + 1}`, C.violet, P ? 15 : 14); p.moveTo([c[0], c[1] + 1.1, 0]);
    return { r, p };
  });
  await until(S(42));
  await play(new M.FadeOut(new M.VGroup(...toks.map(t => t.sh), ...toks.map(t => t.tx), F[0].r, F[0].p, F[1].r, F[1].p)), ...dropBox(),
    new M.LaggedStart(small.map(s => new M.FadeIn(s)), { lagRatio: 0.08, runTime: 1.4 }), ...say('NOW 12 BIKES', C.cyan));
  await until(S(43)); await play(...fbox([['12 bikes', C.cyan], '9 commuter', ['3 cargo', C.amber]], C.cyan));
  await until(S(44)); await play(...frames3.flatMap(f => [new M.Create(f.r), new M.FadeIn(f.p)]), ...say('3 FOLDS', C.violet));
  const commIdx = TYPES12.map((c, k) => c ? -1 : k).filter(k => k >= 0), cargIdx = TYPES12.map((c, k) => c ? k : -1).filter(k => k >= 0);
  await until(S(45));
  await play(new M.LaggedStart(commIdx.map((k, n) => new M.Transform(small[k], shape(false, slot3(n % 3, Math.floor(n / 3)), R12), { pathArc: -0.6 })), { lagRatio: 0.15, runTime: 2.4 }),
    ...say('9 COMMUTER → 3 PER FOLD', C.cyan));
  await until(S(46));
  await play(new M.LaggedStart(cargIdx.map((k, n) => new M.Transform(small[k], shape(true, slot3(n, 3), R12), { pathArc: -0.6 })), { lagRatio: 0.3, runTime: 1.6 }),
    ...say('3 CARGO → 1 PER FOLD', C.amber));
  await until(S(47)); await play(...fbox([['each fold', C.violet], '3 commuter + 1 cargo', ['= 4 bikes', C.cyan]], C.violet));
  await until(S(48)); await play(...fbox([['cargo share', C.amber], 'all:  3 ÷ 12 = 1/4', ['fold: 1 ÷ 4 = 1/4', C.green], ['= 25%', C.amber]], C.amber), ...say('1 IN 4 · SAME AS ALL DATA', C.green));
  await until(S(49)); await play(new M.LaggedStart(frames3.map(f => new M.Indicate(f.r, { color: C.green })), { lagRatio: 0.3, runTime: 1.6 }),
    ...say('EVERY TEST FOLD HAS BOTH TYPES', C.green));
  await until(S(50)); await play(...say('MOST USEFUL WHEN A TYPE IS RARE', C.amber));

  // 51-54 limit: 2 cargo bikes, 3 folds
  const two = [0, 1].map(f => shape(true, [FC3[f][0], FC3[f][1], 0], 0.3));
  const none = pill('0 CARGO', C.pink, P ? 15 : 14); none.moveTo([FC3[2][0], FC3[2][1], 0]);
  await until(S(51)); await play(new M.FadeOut(new M.VGroup(...small)), ...dropBox(), new M.FadeIn(new M.VGroup(...two)),
    ...fbox([['3 folds', C.violet], ['only 2 cargo bikes', C.amber]], C.amber), ...say('3 FOLDS · ONLY 2 CARGO BIKES', C.amber));
  await until(S(52)); await play(new M.FadeIn(none), new M.Indicate(frames3[2].r, { color: C.pink }), ...say('ONE FOLD GETS NO CARGO BIKE', C.pink));
  await until(S(53)); await play(...fbox([['stratification', C.green], ['cannot create bikes', C.pink], ['you do not have', C.pink]], C.pink));
  const back = [...commIdx.map((k, n) => shape(false, slot3(n % 3, Math.floor(n / 3)), R12)), ...cargIdx.map((k, n) => shape(true, slot3(n, 3), R12))];
  await until(S(54)); await play(new M.FadeOut(new M.VGroup(...two, none)), new M.FadeIn(new M.VGroup(...back)), ...fbox([['stratified folds =', C.green], 'the same mix', 'as the original data'], C.green), ...say('EVERY FOLD = THE ORIGINAL MIX', C.green));
}

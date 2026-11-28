// Lab 1: clustering. Six methods group the same 100-600 points at the same time.
import { C, PAL, Q, h, btn, card, page, plot, heat, chart, runner, slider, chips, panel, notice, tryBox, legend, autotest, f, rgb } from './kit.js';
import { makeData, distMatrix, kmeans, gmm, dbscan, agglo, silhouette, ari, selftest, KINDS } from './algo-cluster.js';

const DATA = {
  segments: { name: 'Shop customers', x: ['Visits per month', 0, 20], y: ['Spend per visit ($)', 0, 200],
    story: 'Each dot is one customer of an online shop. Some customers visit often and spend little. Others come rarely and spend a lot. <b>Goal:</b> find the customer groups. Nobody gives us the answer.',
    why: 'These groups are round, about the same size and far apart. This is the easy case: almost every method finds them.' },
  bands: { name: 'Salaries', x: ['Years of experience', 0, 30], y: ['Salary (thousand $)', 20, 140],
    story: 'Each dot is one employee. The company has 3 job levels. In every level the salary grows with experience, so each real group is <b>long and thin</b>.',
    why: 'The real groups are long and thin. <b>K-means</b> and <b>Ward</b> prefer round groups, so they cut the long groups into pieces. The <b>Gaussian mixture</b> can stretch its ellipses along each group.' },
  roads: { name: 'Two roads', x: ['East (km)', 0, 10], y: ['North (km)', 0, 10],
    story: 'Each dot is a shop on a city map. The shops stand along <b>two curved roads</b>.',
    why: 'The real groups are curved. One centre point cannot describe a curve. <b>DBSCAN</b> and <b>single link</b> go from neighbour to neighbour, so they can follow a road.' },
  ring: { name: 'Ring road', x: ['East (km)', 0, 10], y: ['North (km)', 0, 10],
    story: 'Each dot is a delivery address. One group is in the <b>city centre</b>. The other group is along the <b>ring road</b> around the city.',
    why: 'One group is inside the other, and both have the same middle point. Methods that work with centres (<b>k-means</b>, <b>mixture</b>, <b>Ward</b>) cannot separate them.' },
  density: { name: 'Farms and villages', x: ['East (km)', 0, 40], y: ['North (km)', 0, 40],
    story: 'Each dot is a house. Two <b>small villages</b> are dense. Many <b>farms</b> are spread over a wide area next to them.',
    why: 'One group is wide and thin, two groups are small and dense. <b>K-means</b> puts the border half-way between centres, so it gives some farms to the villages. <b>DBSCAN</b> has only one reach: a reach that fits the villages is too small for the farms.' },
  faulty: { name: 'Faulty readings', x: ['Temperature (°C)', 20, 100], y: ['Pressure (bar)', 0, 10],
    story: 'Each dot is one reading from a machine. The machine has 3 normal working states. About <b>1 reading in 8 is faulty</b> and can fall anywhere.',
    why: '<b>DBSCAN</b> is the only method here that can say "this point belongs to no group" (the small dark dots). <b>Single link</b> wastes its groups on lonely points. The other methods must put every faulty reading into a group.' },
  none: { name: 'No groups', x: ['Age (years)', 18, 70], y: ['Spend per year ($)', 0, 2000],
    story: 'Each dot is a customer. Here there are <b>no real groups</b>: the dots are spread evenly.',
    why: 'A method that takes k always returns k groups, even when there are none. Look at the silhouette: it stays low. That is the warning sign. Never trust groups without a check.' },
};
const METHODS = [
  { id: 'kr', name: 'K-means · random start', color: C.cyan }, { id: 'kpp', name: 'K-means++ · smart start', color: C.cyan },
  { id: 'gmm', name: 'Gaussian mixture (EM)', color: C.violet }, { id: 'db', name: 'DBSCAN (density)', color: C.amber },
  { id: 'single', name: 'Hierarchical · single link', color: C.pink }, { id: 'ward', name: 'Hierarchical · Ward', color: C.pink },
];
const S = { kind: KINDS.includes(Q.get('data')) ? Q.get('data') : 'segments', n: +Q.get('n') || 300, spread: 1, seed: 1, start: 1, k: 4, eps: 0.115, minPts: 5, truth: false };
let data, D, M = {}, sc = {}, hcol = {};

const { side, main } = page({ num: 1, title: 'Clustering: find the groups',
  intro: 'Six clustering methods work on the same data at the same time. No method knows the real groups. Watch how each method builds its groups step by step, and which method fits which kind of data.' });

// ----- side: data, knobs -----
const story = h('p', { class: 'lab-story' });
const pick = chips(KINDS.map(id => ({ id, name: DATA[id].name })), S.kind, id => { S.kind = id; S.seed = 1; S.start = 1; newData(true); });
const kN = slider({ label: 'Points', min: 100, max: 600, step: 50, value: S.n, oninput: v => { S.n = v; newData(true); } });
const kSp = slider({ label: 'Noise', min: 0.5, max: 2, step: 0.1, value: 1, fmt: v => '×' + v.toFixed(1), oninput: v => { S.spread = v; newData(false); } });
const kK = slider({ label: 'k = groups to find', min: 2, max: 8, value: 4, oninput: v => { S.k = v; restart(); } });
const kEps = slider({ label: 'DBSCAN reach', min: 0.03, max: 0.3, step: 0.005, value: 0.115, fmt: v => v.toFixed(3), oninput: v => { S.eps = v; restart(); } });
const kMin = slider({ label: 'DBSCAN neighbours', min: 3, max: 12, value: 5, oninput: v => { S.minPts = v; restart(); } });
const bTruth = btn('Show real groups', () => { S.truth = !S.truth; bTruth.textContent = S.truth ? 'Show method groups' : 'Show real groups'; bTruth.classList.toggle('go', S.truth); frame(); }, 'ghost');
side.append(card('lab-data', h('h2', {}, '1 · Choose the data'), pick.el, story,
  h('div', { class: 'lab-knobs' }, kN.el, kSp.el, kK.el, kEps.el, kMin.el),
  h('div', { class: 'lab-row' }, btn('New data', () => { S.seed++; newData(false); }), btn('New start', () => { S.start++; restart(); }), bTruth)));
const R = runner({ step, reset: restart0, frame });
side.append(R.el);
const note = notice(); side.append(note.el);
side.append(tryBox([
  'Choose <b>Shop customers</b>. Set k to 2, then to 6. Which methods change? Which method does not use k?',
  'Choose <b>Ring road</b>. Make the DBSCAN reach very small, then very large. Find the range where DBSCAN works.',
  'Choose <b>Salaries</b> and press <b>New start</b> a few times. Does the mixture find the 3 bands every time?',
  'Choose <b>Two roads</b>. Raise <b>Noise</b> until single link breaks. A few stray shops are enough.']));

// ----- main: six panels -----
const grid = h('div', { class: 'lab-grid', style: { '--cols': 3 } }); main.append(grid);
const P = {}, hm = {};
for (const m of METHODS) {
  const pl = plot({}); hm[m.id] = heat(56, 56);
  pl.draw = () => draw(m.id, pl);
  P[m.id] = { pl, pan: panel(m.name, m.color, pl.el) }; grid.append(P[m.id].pan.el);
}
const table = h('table', { class: 'lab-table' });
const ch = chart({ aspect: 2.4, xlab: 'step', intX: true });
main.append(h('div', { class: 'lab-two' },
  card('', h('h2', {}, 'Scoreboard'), table, h('p', { class: 'lab-story', html: '<b>Silhouette</b>: from −1 to 1. High = the groups are tight and far from each other. <b>Match</b>: how well the groups agree with the real groups (1 = the same, 0 = like chance). In real work you do not know the real groups, so you only have the silhouette.' })),
  card('', h('h2', {}, 'K-means: inertia at each step'), ch.el, h('p', { class: 'lab-story', html: '<b>Inertia</b> = the sum of squared distances from every point to the centre of its group. K-means makes it smaller at every step. It can never rise.' }))));

function newData(resetKnobs) {
  data = makeData(S.kind, S.n, S.spread, S.seed); D = distMatrix(data.X, data.n);
  if (resetKnobs) { S.k = data.k || 3; kK.set(S.k); S.eps = data.eps; kEps.set(S.eps); S.minPts = 5; kMin.set(5); }
  const d = DATA[S.kind]; story.innerHTML = d.story + ` <span style="color:${C.dim}">(${data.n} points${data.k ? ', ' + (S.kind === 'faulty' ? '3 real groups + faulty readings' : data.k + ' real groups') : ''})</span>`;
  for (const m of METHODS) P[m.id].pl.axes = { x: { name: d.x[0], lo: d.x[1], hi: d.x[2] }, y: { name: d.y[0], lo: d.y[1], hi: d.y[2] } };
  restart();
}
function restart0() {
  const { X, n } = data, k = S.k;
  M = { kr: kmeans(X, n, k, S.start * 101 + 7, 'random'), kpp: kmeans(X, n, k, S.start * 101 + 7, 'pp'), gmm: gmm(X, n, k, S.start * 101 + 7), db: dbscan(D, n, S.eps, S.minPts), single: agglo(D, n, k, 'single'), ward: agglo(D, n, k, 'ward') };
  sc = {}; hcol = { single: { map: new Map(), free: [0, 1, 2, 3, 4, 5, 6, 7], seen: 0 }, ward: { map: new Map(), free: [0, 1, 2, 3, 4, 5, 6, 7], seen: 0 } };
}
function restart() { restart0(); R.clear(); frame(); }
function score(id) {
  const m = M[id], lab = m.lab, n = data.n;
  const s = { sil: silhouette(D, lab, n), match: data.y ? ari(lab, data.y, n) : NaN, groups: new Set([...lab].filter(v => v >= 0)).size };
  return s;
}
function step() {
  let all = true;
  for (const m of METHODS) { const a = M[m.id]; if (!a.done) { a.step(); if (a.done) sc[m.id] = score(m.id); } if (!a.done) all = false; }
  return all;
}
// hierarchical colours: a group keeps the colour of its bigger half, so colours stay stable while groups merge
function hierColours(id) {
  const a = M[id], hc = hcol[id];
  for (; hc.seen < a.merges.length; hc.seen++) {
    const [keep, gone] = a.merges[hc.seen], ck = hc.map.get(keep), cg = hc.map.get(gone);
    if (ck == null && cg != null) hc.map.set(keep, cg); else if (ck != null && cg != null) hc.free.push(cg); else if (ck == null && hc.free.length) hc.map.set(keep, hc.free.shift());
    hc.map.delete(gone);
  }
  if (a.done) for (let i = 0; i < data.n; i++) if (!hc.map.has(a.lab[i]) && hc.free.length) hc.map.set(a.lab[i], hc.free.shift());
  return hc.map;
}
function draw(id, pl) {
  const a = M[id], { X, n } = data, ctx = pl.ctx, r = pl.W < 240 ? 1.7 : n > 400 ? 2.1 : 2.6; if (!a) return;
  let col;
  if (S.truth && data.y) col = i => PAL[data.y[i]];
  else if (S.truth) col = () => C.grey;
  else if (id === 'kr' || id === 'kpp' || id === 'gmm') col = i => a.lab[i] < 0 ? C.grey : PAL[a.lab[i]];
  else if (id === 'db') col = i => a.lab[i] === -2 ? C.grey : a.lab[i] === -1 ? null : PAL[a.lab[i] % PAL.length];
  else { const map = hierColours(id); col = i => { const c = map.get(a.lab[i]); return c == null ? C.grey : PAL[c]; }; }
  if ((id === 'kr' || id === 'kpp') && !S.truth) {          // light regions: the nearest centre owns the area
    const g = hm[id], c = a.cent;
    for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) { const x = g.gx(i, pl), y = g.gy(j, pl); let b = 0, bd = Infinity; for (let q = 0; q < a.k; q++) { const d = (x - c[2 * q]) ** 2 + (y - c[2 * q + 1]) ** 2; if (d < bd) { bd = d; b = q; } } const [R_, G_, B_] = rgb(PAL[b]), o = 4 * (j * g.w + i); g.d[o] = R_; g.d[o + 1] = G_; g.d[o + 2] = B_; g.d[o + 3] = 255; }
    g.flush(); pl.heat(g, 0.13, false);
  }
  pl.dots(X, n, col, r);
  if (id === 'db' && !S.truth) { pl.dots(X, n, i => a.lab[i] === -1 ? '#8a94b8' : null, r * .55); }
  if (S.truth) return;
  if (id === 'kr' || id === 'kpp') {
    for (let q = 0; q < a.k; q++) { pl.path(a.trail.map(t => [t[2 * q], t[2 * q + 1]]), '#ffffffaa', 1.2); pl.mark(a.cent[2 * q], a.cent[2 * q + 1], PAL[q], pl.W < 240 ? 5 : 7); }
  } else if (id === 'gmm') {
    for (let q = 0; q < a.k; q++) {                          // ellipse = 2 standard deviations of the cloud
      const A = a.cov[3 * q], B = a.cov[3 * q + 1], Dd = a.cov[3 * q + 2], tr = (A + Dd) / 2, det = Math.sqrt(Math.max(0, ((A - Dd) / 2) ** 2 + B * B));
      const l1 = tr + det, l2 = Math.max(tr - det, 1e-9), ang = 0.5 * Math.atan2(2 * B, A - Dd), pts = [];
      for (let t = 0; t <= 48; t++) { const u = t / 48 * 2 * Math.PI, ex = 2 * Math.sqrt(l1) * Math.cos(u), ey = 2 * Math.sqrt(l2) * Math.sin(u); pts.push([a.mean[2 * q] + ex * Math.cos(ang) - ey * Math.sin(ang), a.mean[2 * q + 1] + ex * Math.sin(ang) + ey * Math.cos(ang)]); }
      pl.path(pts, '#050814', 4); pl.path(pts, PAL[q], 2); pl.mark(a.mean[2 * q], a.mean[2 * q + 1], PAL[q], 3, 'o');
    }
  } else if (id === 'db') {                                   // the reach, drawn to scale
    const rx = pl.px(pl.xr[0] + S.eps) - pl.px(pl.xr[0]), cx = pl.m.l + 8 + rx, cy = pl.m.t + pl.ih - 8 - rx - (pl.W < 235 ? 14 : 16);
    ctx.beginPath(); ctx.arc(cx, cy, rx, 0, 6.2832); ctx.fillStyle = '#fbbf2422'; ctx.fill(); ctx.strokeStyle = C.amber; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = C.amber; ctx.font = '600 10.5px Consolas, monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('reach', cx + rx + 5, cy);
  }
}
const scLine = id => { const s = sc[id]; return s ? `silhouette <b>${f(s.sil)}</b>` + (data.y ? ` · match <b>${f(s.match)}</b>` : '') : '<span style="color:#7d89b0">working…</span>'; };
function frame() {
  const n = data.n;
  for (const m of METHODS) {
    const a = M[m.id], p = P[m.id]; let top;
    if (m.id === 'kr' || m.id === 'kpp') top = a.iter ? `step <b>${a.iter}</b> · inertia <b>${f(a.inertia, 2)}</b> · moved <b>${a.moved}</b>` : `step 0 · ${a.k} centres placed`;
    else if (m.id === 'gmm') top = a.iter ? `step <b>${a.iter}</b> · log-likelihood <b>${f(a.ll, 3)}</b>` : `step 0 · ${a.k} round clouds placed`;
    else if (m.id === 'db') top = `visited <b>${a.visited}</b> of ${n} · groups <b>${a.groups}</b> · noise <b>${a.noise}</b>`;
    else top = `groups left <b>${a.groups}</b>` + (a.merges.length ? ` · last join: ${f(a.lastDist, 3)}` : ' · every point alone');
    p.pan.stat(top + '<br>' + (R.count || a.done ? scLine(m.id) : '&nbsp;'));
    p.pan.note(a.done && R.count ? '✓ done' : '');
    p.pl.redraw();
  }
  ch.set([{ name: 'random start', color: C.amber, data: M.kr.hist, xs: M.kr.hist.map((_, i) => i + 1) }, { name: 'k-means++ start', color: C.cyan, data: M.kpp.hist, xs: M.kpp.hist.map((_, i) => i + 1) }], { xmin: 1, xmax: 5 });
  const rows = METHODS.map(m => { const s = sc[m.id]; const v = s && data.y ? Math.max(0, s.match) : 0;
    return `<tr><td style="color:${m.color}">${m.name.replace('Hierarchical · ', '').replace(/ · .* start/, m.id === 'kr' ? ' random' : '').replace(' (EM)', '').replace(' (density)', '')}</td><td class="num">${s ? s.groups : '–'}</td><td class="num">${s ? f(s.sil) : '–'}</td><td class="num">${s && data.y ? f(s.match) : '–'}</td><td style="width:26%"><div class="lab-bar"><i style="width:${v * 100}%;background:${m.color}"></i></div></td></tr>`; });
  const html = `<tr><th>Method</th><th>Groups</th><th>Silhouette</th><th>Match</th><th></th></tr>` + rows.join('');
  if (table._h !== html) { table._h = html; table.innerHTML = html; }
  note.set(notes());
}
function notes() {
  const d = DATA[S.kind], out = [], allDone = METHODS.every(m => M[m.id].done) && R.count > 0;
  if (!R.count) out.push(`Press <b>Play</b>. Six methods group the same ${data.n} points at the same time. <b>Step</b> moves one step.`);
  out.push(d.why);
  if (!allDone) { if (R.count) out.push('K-means and the mixture move their centres. DBSCAN visits the points one after another. The hierarchical methods join the two closest groups again and again.'); return out; }
  const name = id => METHODS.find(m => m.id === id).name.replace(' · ', ', ');
  if (data.y) {
    const ord = METHODS.map(m => [m.id, sc[m.id].match]).sort((a, b) => b[1] - a[1]), best = ord.filter(o => o[1] >= ord[0][1] - 0.03), worst = ord[ord.length - 1];
    if (ord[0][1] - worst[1] < 0.08) out.push(`<b>Result:</b> all six methods agree with the real groups about equally (match ${f(worst[1])} to ${f(ord[0][1])}).`);
    else out.push(`<b>Result:</b> best match with the real groups: ${best.map(o => `<b>${name(o[0])}</b> (${f(o[1])})`).join(', ')}. Weakest: ${name(worst[0])} (${f(worst[1])}).`);
  } else {
    const hi = Math.max(...METHODS.map(m => sc[m.id].sil).filter(Number.isFinite));
    out.push(`<b>Result:</b> the best silhouette is only ${f(hi)}. Clear groups usually score above 0.5.`);
  }
  const jr = M.kr.inertia, jp = M.kpp.inertia;
  if (Math.abs(jr - jp) > 0.03 * Math.min(jr, jp)) out.push(`The two k-means runs end in different places: inertia ${f(jr)} with the random start, ${f(jp)} with the k-means++ start. K-means only improves step by step from its start, so a bad start can give a worse result.`);
  else out.push(`Both k-means starts reach the same inertia here (${f(jp)}), in ${M.kr.iter} and ${M.kpp.iter} steps. Press <b>New start</b> to try other starts.`);
  if (data.k && S.kind !== 'faulty' && S.k !== data.k) out.push(`You ask for k = ${S.k} groups, but the data has ${data.k} real groups. K-means, the mixture and the hierarchical methods must return exactly ${S.k}. DBSCAN does not use k.`);
  const db = M.db;
  if (db.noise > 0.3 * data.n) out.push(`DBSCAN calls ${db.noise} of ${data.n} points noise. The reach is too small for this data (or the number of neighbours is too high).`);
  else if (db.groups <= 1 && data.k > 1) out.push('DBSCAN joins everything into one group. The reach is too large: it bridges the gaps between the real groups.');
  else out.push(`DBSCAN found ${db.groups} group${db.groups === 1 ? '' : 's'} by itself and left ${db.noise} point${db.noise === 1 ? '' : 's'} as noise. Nobody told it the number of groups.`);
  if (M.gmm.iter > 2.5 * Math.max(M.kr.iter, M.kpp.iter)) out.push(`K-means settled in ${M.kpp.iter} steps. The mixture needed ${M.gmm.iter} steps: in EM every point belongs a little to every cloud, so the clouds move slowly.`);
  return out;
}

newData(true);
if (Q.get('k')) { S.k = +Q.get('k'); kK.set(S.k); restart(); }
if (Q.get('autotest')) autotest('clustering', async t => {
  selftest(t, true);
  for (const kind of KINDS) for (const n of [100, 600]) {
    S.kind = kind; S.n = n; pick.set(kind); kN.set(n); newData(true);
    const g = R.runAll(3000);
    t.ok(g < 3000, `${kind} n=${n}: every method finishes`);
    t.ok(METHODS.every(m => sc[m.id] && (Number.isFinite(sc[m.id].sil) || sc[m.id].groups < 2)), `${kind} n=${n}: every method has a score`);
    t.ok(notes().length >= 3, `${kind} n=${n}: notice text`);
    t.log(`${kind} n=${n}: ` + METHODS.map(m => `${m.id} g=${sc[m.id].groups} sil=${f(sc[m.id].sil)} match=${f(sc[m.id].match)}`).join(' | '));
    await new Promise(r => setTimeout(r, 0));
  }
  S.kind = 'segments'; S.n = 300; pick.set('segments'); kN.set(300); newData(true);
}); else R.auto();

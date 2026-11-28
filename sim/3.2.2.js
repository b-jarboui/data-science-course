// 3.2.2 Try it: duplicate records.
// The learner edits a small greenhouse log (tap a row, copy it, remove it, change its temperature),
// sorts it by the key (sensor + time), makes random logs, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  // sensor, hour, °C, extra copy?
  const START = [['A', 9, 21], ['A', 10, 24], ['B', 10, 24], ['B', 11, 24], ['A', 11, 27], ['A', 11, 27, true]];
  const MAX = 12;
  let rows = [], real = new Set(), sel = 0, copied = 0, random = false, msg = '';
  const key = r => r.sn + '|' + r.hr, reading = r => key(r) + '|' + r.t;

  function load(list, isRandom) {
    rows = list.map(([sn, hr, t, copy]) => ({ sn, hr, t, copy: !!copy }));
    real = new Set(rows.filter(r => !r.copy).map(reading));
    sel = 0; random = isRandom; msg = '';
  }
  load(START, false);

  const svg = s('svg', { viewBox: '0 0 700 360' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: find the duplicates'),
    h('p', { class: 'sub' }, 'This is the greenhouse log: one row per reading. The key is sensor + time. Tap a row, then copy it, remove it, or change its temperature.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1 °C', () => bump(-1)), btn('+1 °C', () => bump(1)),
          btn('Copy row', copyRow), btn('Remove row', removeRow), selLabel),
        h('div', { class: 'sim-row' },
          btn('Sort by key', sortRows, 'go'),
          btn('Remove duplicates', removeDups),
          btn('Trap: remove equal temperatures', trap),
          btn('New data (random)', newData),
          btn('Start again', () => { load(START, false); draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Remove the duplicate row, and only the duplicate.',
      check: st => st.n > 0 && st.dups === 0 && st.lost === 0 && st.conflicts === 0,
      why: 'Right: the extra copy had the same sensor, time and temperature. Every real reading is still in the log.' },
    { text: 'Tap a sensor A row and press “Copy row”. Watch sensor A’s mean.',
      check: st => st.copied > 0 && st.aMoved,
      why: 'The copy counts one reading twice, so it pulls the mean toward that value.' },
    { text: 'Make a conflict: two rows with the same sensor and time, but different temperatures.',
      check: st => st.conflicts > 0,
      why: 'Same key, different values: that is not a duplicate. Someone must check which value is right.' },
    { text: 'Press “New data”, then clean the log: no extra copies, and no real reading lost.',
      check: st => st.random && st.n > 0 && st.dups === 0 && st.lost === 0 && st.conflicts === 0,
      why: 'Sort by the key, look for a key that appears twice with the same value, and keep one copy.' },
  ]);

  function analyze() {
    const values = new Map(), seen = new Set();
    rows.forEach(r => { const k = key(r); if (!values.has(k)) values.set(k, new Set()); values.get(k).add(r.t); });
    const status = rows.map(r => {
      const d = seen.has(reading(r)); seen.add(reading(r));
      return d ? 'dup' : values.get(key(r)).size > 1 ? 'conflict' : '';
    });
    const present = new Set(rows.map(reading));
    return {
      status,
      dups: status.filter(x => x === 'dup').length,
      conflicts: [...values.values()].filter(v => v.size > 1).length,
      lost: [...real].filter(x => !present.has(x)).length
    };
  }

  function bump(d) {
    const r = rows[sel]; if (!r) return;
    const old = reading(r);
    r.t = Math.max(-10, Math.min(60, r.t + d));
    if (!r.copy) {
      if (!rows.some(o => !o.copy && reading(o) === old)) real.delete(old);
      real.add(reading(r));
    }
    msg = ''; draw();
  }
  function copyRow() {
    if (!rows[sel] || rows.length >= MAX) return;
    rows.splice(sel + 1, 0, { ...rows[sel], copy: true });
    sel++; copied++;
    msg = 'You added a copy of the same reading: same sensor, same time, same temperature.';
    draw();
  }
  function removeRow() {
    if (!rows[sel]) return;
    rows.splice(sel, 1);
    sel = Math.max(0, Math.min(sel, rows.length - 1));
    msg = ''; draw();
  }
  function sortRows() {
    const cur = rows[sel];
    rows.sort((a, b) => a.sn.localeCompare(b.sn) || a.hr - b.hr);
    sel = Math.max(0, rows.indexOf(cur));
    msg = 'Sorted by the key. Rows with the same sensor and time now sit next to each other.';
    draw();
  }
  function removeDups() {
    const { status } = analyze(), before = rows.length;
    const cur = rows[sel];
    rows = rows.filter((_, i) => status[i] !== 'dup');
    const n = before - rows.length;
    sel = Math.max(0, rows.indexOf(cur));
    msg = n ? `Removed ${n} extra ${n === 1 ? 'copy' : 'copies'}. Every reading now counts once.` : 'No extra copies to remove.';
    draw();
  }
  function trap() {
    const seenT = new Set(), before = rows.length;
    rows = rows.filter(r => { if (seenT.has(r.t)) return false; seenT.add(r.t); return true; });
    sel = 0;
    const n = before - rows.length, { lost } = analyze();
    msg = n ? `Removed ${n} rows only because their temperatures were equal. Real readings lost: ${lost}. Press “Start again” or “New data” to try again.`
      : 'No two rows have the same temperature, so nothing was removed.';
    draw();
  }
  function newData() {
    const list = [];
    for (const sn of ['A', 'B']) {
      let t = rnd(19, 25);
      for (let hr = 9; hr <= 12; hr++) { list.push([sn, hr, t]); t += [0, 0, 1, 2, 3, -1][rnd(0, 5)]; }
    }
    for (let k = rnd(0, 2); k > 0; k--) list.splice(rnd(0, list.length - 1), 1);
    for (let k = rnd(1, 2); k > 0; k--) { const r = list[rnd(0, list.length - 1)]; list.push([r[0], r[1], r[2], true]); }
    for (let i = list.length - 1; i > 0; i--) { const j = rnd(0, i); [list[i], list[j]] = [list[j], list[i]]; }
    load(list, true);
    draw();
  }

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps the table readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1, RH = 44 * F, Y0 = 44 * F;
  const XS = VW * 0.12, XT = VW * 0.32, XV = VW * 0.52, XTAG = VW * 0.79;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), i = Math.floor((p.y - Y0) / RH);
    if (i < 0 || i >= rows.length) return;
    sel = i; draw();
  });

  const r2 = x => Math.round(x * 100) / 100;
  const sum = a => a.reduce((x, r) => x + r.t, 0);
  const mono = 'Consolas, monospace';

  function draw() {
    const a = analyze(), n = rows.length;
    const H = Y0 + n * RH + 40 * F;
    svg.setAttribute('viewBox', `0 0 ${VW} ${H}`);
    const k = [];
    const hy = Y0 - 14 * F;
    [['sensor', XS], ['time', XT], ['°C', XV], ['check', XTAG]].forEach(([t, x]) =>
      k.push(s('text', { x, y: hy, fill: C.muted, 'font-size': 14 * F, 'text-anchor': 'middle', 'font-family': mono }, t)));
    rows.forEach((r, i) => {
      const y = Y0 + i * RH, st = a.status[i];
      const tone = st === 'dup' ? C.pink : st === 'conflict' ? C.amber : null;
      k.push(s('rect', { x: 4, y: y + 3, width: VW - 8, height: RH - 6, rx: 8, fill: tone || C.bg, 'fill-opacity': tone ? 0.16 : 0.6,
        stroke: i === sel ? C.cyan : C.line, 'stroke-width': i === sel ? 2.5 : 1 }));
      const mid = y + RH / 2 + 6 * F;
      const txt = (x, t, fill, bold) => s('text', { x, y: mid, fill, 'font-size': 18 * F, 'font-weight': bold ? 700 : 400, 'text-anchor': 'middle', 'font-family': mono }, t);
      k.push(txt(XS, r.sn, r.sn === 'A' ? C.cyan : C.violet, true), txt(XT, `${r.hr}:00`, C.ink), txt(XV, r.t, C.ink, true));
      if (tone) k.push(s('text', { x: XTAG, y: mid, fill: tone, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono },
        st === 'dup' ? 'EXTRA COPY' : 'CONFLICT'));
    });
    if (!n) k.push(s('text', { x: VW / 2, y: Y0 + 24 * F, fill: C.muted, 'font-size': 16 * F, 'text-anchor': 'middle', 'font-family': mono }, 'The log is empty.'));
    // the key: an amber outline around the sensor and time columns
    const kx0 = 10, kx1 = (XT + XV) / 2, ky0 = hy - 20 * F, ky1 = Y0 + Math.max(1, n) * RH + 2;
    k.push(s('rect', { x: kx0, y: ky0, width: kx1 - kx0, height: ky1 - ky0, rx: 10, fill: 'none', stroke: C.amber, 'stroke-width': 2 }),
      s('text', { x: (kx0 + kx1) / 2, y: ky1 + 22 * F, fill: C.amber, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, 'KEY = SENSOR + TIME'));
    svg.replaceChildren(...k);

    // sensor A's mean: as logged, and with each reading counted once
    const A = rows.filter(r => r.sn === 'A');
    const seenA = new Set(), once = A.filter(r => { const x = reading(r); if (seenA.has(x)) return false; seenA.add(x); return true; });
    const lines = [];
    let aMoved = false;
    if (A.length) {
      const mLog = sum(A) / A.length, mOnce = sum(once) / once.length, list = A.map(r => r.t).join(' + ');
      aMoved = once.length < A.length && Math.round(mLog * 1000) !== Math.round(mOnce * 1000);
      lines.push(`sensor A as logged: ${list.length <= 26 ? list : 'all A rows'} = ${sum(A)}`,
        [`  mean = ${sum(A)} ÷ ${A.length} = ${fmt(r2(mLog))}`, C.amber],
        [`each reading once: ${sum(once)} ÷ ${once.length} = ${fmt(r2(mOnce))}`, C.green]);
    } else lines.push('No sensor A rows left.');
    lines.push([`extra copies: ${a.dups} · conflicts: ${a.conflicts} · real readings lost: ${a.lost}`, a.lost ? C.pink : C.muted]);
    fbox(box, lines);

    note.textContent = msg || (a.dups ? 'Pink rows are extra copies: same sensor, same time and same temperature as a row above. Sort by the key to see them side by side.'
      : a.conflicts ? 'Amber rows share a key but disagree on the temperature: a conflict to check, not a duplicate.'
      : 'No duplicates: every key appears once. Equal temperatures at different times or sensors are real readings.');
    const cur = rows[sel];
    selLabel.textContent = cur ? `Selected: sensor ${cur.sn} at ${cur.hr}:00 (${cur.t} °C)` : 'No row selected';
    chal.update({ n, dups: a.dups, conflicts: a.conflicts, lost: a.lost, copied, random, aMoved });
  }
  draw();
  return () => {};
}

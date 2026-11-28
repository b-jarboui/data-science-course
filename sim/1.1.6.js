// 1.1.6 Try it: units of measurement. One dot per second; dots gather into groups of sixty (one minute each).
// The learner sets a wait in seconds (slider, -10/+10, the café rows or a random customer),
// sees the same dots grouped into minutes, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const CAFE = [120, 90, 150, 60, 180, 60];
  let sec = 120, grouped = true, randoms = 0;

  const svg = s('svg', { viewBox: '0 0 700 300' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const slider = h('input', { type: 'range', min: 5, max: 300, step: 5, value: sec, style: { width: '100%', accentColor: C.cyan, height: '36px' } });
  slider.addEventListener('input', () => set(+slider.value));
  const groupBtn = btn('', () => { grouped = !grouped; draw(); });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: seconds into minutes'),
    h('p', { class: 'sub' }, 'Each dot is one second. Set a wait, then see the same dots gathered into groups of sixty: one group is one minute.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg, slider,
        h('div', { class: 'sim-row' },
          btn('−10 s', () => set(sec - 10)), btn('+10 s', () => set(sec + 10)), groupBtn,
          btn('New customer (random)', () => { randoms++; set(rnd(1, 60) * 5); }, 'go')),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Café customers:'),
          ...CAFE.map((v, i) => btn(String(i + 1), () => set(v), 'ghost')))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Make a wait of exactly four minutes.',
      check: st => st.sec === 240, why: 'Yes: four full groups of sixty dots, two hundred and forty seconds.' },
    { text: 'Make a wait of three and a half minutes.',
      check: st => st.sec === 210, why: 'Right: three full groups, and thirty dots make half a group. Two hundred and ten seconds.' },
    { text: 'The promise: no wait over three minutes. Find the longest wait, in seconds, that still keeps it.',
      check: st => st.sec === 180, why: 'One hundred and eighty seconds is exactly three groups: three minutes, not more.' },
    { text: 'Press “New customer” three times. Is the number of minutes always the seconds divided by sixty?',
      check: st => st.randoms >= 3, why: 'Always. We only gather the same dots into groups of sixty, so the wait never changes, only the number.' },
  ]);

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const PER = NARROW ? 3 : 5;                 // groups per line
  const VW = NARROW ? 400 : 700;
  svg.setAttribute('viewBox', `0 0 ${VW} 300`);
  const SP = Math.min(14, (VW - 20 - (PER - 1) * 14) / (PER * 10));
  const GW = 10 * SP, GH = 6 * SP, GAP = 14, LINEH = GH + 40;
  const X0 = (VW - (PER * GW + (PER - 1) * GAP)) / 2;

  function set(v) { sec = Math.max(5, Math.min(300, v)); slider.value = sec; draw(); }

  function pos(k) {
    if (!grouped) {                       // one long strip, wrapped into lines, no gaps
      const c = Math.floor(k / 6), r = k % 6;
      const colsLine = Math.floor((VW - 2 * X0) / SP);
      const line = Math.floor(c / colsLine), cc = c % colsLine;
      return [X0 + SP / 2 + cc * SP, 46 + line * LINEH + r * SP + SP / 2];
    }
    const g = Math.floor(k / 60), j = k % 60, line = Math.floor(g / PER), gi = g % PER;
    return [X0 + gi * (GW + GAP) + Math.floor(j / 6) * SP + SP / 2, 46 + line * LINEH + (j % 6) * SP + SP / 2];
  }

  function draw() {
    const k = [], full = Math.floor(sec / 60), rest = sec % 60, mins = sec / 60;
    k.push(s('text', { x: VW / 2, y: 26, fill: C.cyan, 'font-size': NARROW ? 20 : 18, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Segoe UI' },
      `${sec} dots = ${sec} seconds`));
    if (grouped) {
      const groups = full + (rest ? 1 : 0);
      for (let g = 0; g < groups; g++) {
        const line = Math.floor(g / PER), gi = g % PER, x = X0 + gi * (GW + GAP), y = 46 + line * LINEH;
        const part = g < full ? 1 : rest / 60;
        k.push(s('rect', { x, y, width: GW, height: GH, fill: 'none', stroke: part === 1 ? C.amber : C.muted, 'stroke-width': 2, rx: 3 }));
        k.push(s('text', { x: x + GW / 2, y: y + GH + 20, fill: part === 1 ? C.amber : C.pink, 'font-size': NARROW ? 17 : 15, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Segoe UI' },
          part === 1 ? '1 min' : `${rest} s = ${fmt(Math.round(part * 100) / 100)} min`));
      }
    }
    for (let i = 0; i < sec; i++) {
      const [x, y] = pos(i);
      k.push(s('circle', { cx: x, cy: y, r: SP * 0.34, fill: C.cyan }));
    }
    svg.replaceChildren(...k);
    const nLines = Math.floor(Math.ceil(sec / 60 - 1e-9) / PER - 1e-9) + 1;   // grouped lines; the strip never needs more
    svg.setAttribute('viewBox', `0 0 ${VW} ${46 + Math.max(1, nLines) * LINEH + 4}`);
    groupBtn.textContent = grouped ? 'Spread the dots out' : 'Group into minutes';
    fbox(box, [`wait    = ${sec} seconds`,
      `groups of 60: ${full} full${rest ? ` + ${rest} left (${fmt(Math.round(rest / 60 * 100) / 100)} of a group)` : ''}`,
      [`minutes = ${sec} ÷ 60 = ${fmt(Math.round(mins * 100) / 100)}`, C.amber]]);
    note.textContent = (sec <= 180 ? 'Promise kept: ' : 'Promise broken: ') + `${fmt(Math.round(mins * 100) / 100)} minutes ` +
      (sec <= 180 ? 'is not more than three.' : 'is more than three.') + ' Same dots, same wait: only the unit changes the number.';
    chal.update({ sec, randoms });
  }
  draw();
  return () => {};
}

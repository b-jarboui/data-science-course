// 12.1.2 Three ways a machine can learn (script.v17.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.20;
  const PILL = P ? [0, 3.75, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, -4.90, 0] : [4.65, -0.50, 0];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  // Customer, month (0-based), hours, help requests, cancelled within 30 days.
  const records = [
    ['Ali', 0, 20, 0, false], ['Ali', 1, 18, 0, false], ['Ali', 2, 22, 1, false],
    ['Ali', 3, 19, 0, false], ['Ali', 4, 21, 0, false], ['Ali', 5, 20, 0, false],
    ['Bea', 0, 12, 0, false], ['Bea', 1, 6, 1, false], ['Bea', 2, 2, 1, true],
    ['Chen', 0, 15, 0, false], ['Chen', 1, 10, 0, false], ['Chen', 2, 7, 1, false],
    ['Chen', 3, 3, 2, true], ['Farah', 1, 1, 0, true],
    ['Dina', 2, 3, 0, false], ['Dina', 3, 9, 0, false], ['Dina', 4, 14, 0, false],
    ['Dina', 5, 16, 0, false], ['Eli', 4, 11, 0, false], ['Eli', 5, 6, 1, true],
  ];
  const light = records.filter(r => r[2] < 5);
  const middle = records.filter(r => r[2] >= 5 && r[2] < 18);
  const heavy = records.filter(r => r[2] >= 18);
  const find = (name, month) => records.find(r => r[0] === name && r[1] === month);
  const farah = find('Farah', 1), ali = find('Ali', 0), dina = find('Dina', 2);
  const point = (x, y) => [x, y, 0];
  const outcome = r => r[4] ? 'Cancel' : 'Stay';
  const labelColor = r => r[4] ? C.pink : C.cyan;
  const cardH = 0.72;

  function text(s, x, y, size, color = C.ink, width = Infinity, mono = false, bold = false) {
    const t = T(s, size, color, mono, bold);
    const w = t.getWidth();
    if (w > width) t.scale(width / w);
    t.moveTo(point(x, y));
    return t;
  }

  function panel(x, y, width, height, color, opacity = 0.96, strokeWidth = 2) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.14, color, strokeWidth });
    r.setFill(C.card, opacity);
    r.moveTo(point(x, y));
    return r;
  }

  function outlineBox(x, y, width, height, color) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2.5 });
    r.setFill(color, 0);
    r.moveTo(point(x, y));
    return r;
  }

  function line(x1, y1, x2, y2, color = C.muted, strokeWidth = 2) {
    return new M.Line({ start: point(x1, y1), end: point(x2, y2), color, strokeWidth });
  }

  function say(s, color = C.cyan) {
    const animations = showA(s, color, PILL, P ? 18 : 19);
    animations.forEach(a => { a.duration = 0.34; });
    return animations;
  }

  const fadeIn = m => new M.FadeIn(m, { runTime: 0.30 });
  const fadeOut = m => new M.FadeOut(m, { runTime: 0.16 });
  let picture = [], boxNow = null, hiBox = null;

  function fbox(lines, color) {
    const size = P ? 20 : 19, lh = P ? 0.46 : 0.44;
    const maxw = P ? FW - 0.8 : 3.8;
    const padX = 0.44, padY = 0.36;
    const innerMax = maxw - padX;
    const built = lines.map(raw => {
      const [s, c] = Array.isArray(raw) ? raw : [raw, C.ink];
      const t = T(s, size, c, true);
      const rawW = t.getWidth();
      const sc = rawW > innerMax ? innerMax / rawW : 1;
      if (sc < 1) t.scale(sc);
      return { t, w: rawW * sc };
    });
    const width = Math.min(maxw, Math.max(...built.map(b => b.w)) + padX);
    const height = built.length * lh + padY;
    const bg = panel(BOXP[0], BOXP[1], width, height, color);
    built.forEach(({ t, w }, i) => t.moveTo(point(
      BOXP[0] - width / 2 + padX / 2 + w / 2,
      BOXP[1] + ((built.length - 1) / 2 - i) * lh,
    )));
    return new M.VGroup(bg, ...built.map(b => b.t));
  }

  // Pass null for next to keep the existing diagram.
  async function frame(next, tag, color = C.cyan, lines = [], reveal = false) {
    const departures = [
      ...(next === null ? [] : picture.map(fadeOut)),
      ...(boxNow ? [fadeOut(boxNow)] : []),
      ...(next !== null && hiBox ? [fadeOut(hiBox)] : []),
    ];
    if (next !== null) hiBox = null;
    if (departures.length) await play(...departures);
    const arrivals = next === null ? [] : next.map(fadeIn);
    if (next !== null) picture = next;
    boxNow = lines.length ? fbox(lines, color) : null;
    await play(
      ...say(tag, color),
      ...(reveal && arrivals.length
        ? [new M.LaggedStart(arrivals, { lagRatio: 0.08, runTime: 0.90 })]
        : arrivals),
      ...(boxNow ? [fadeIn(boxNow)] : []),
    );
  }

  function tile(x, y, width, title, detail, color, height = 1.50, titleSize, detailSize) {
    const ts = titleSize ?? (P ? 25 : 23);
    const ds = detailSize ?? (P ? 20 : 19);
    const dy = height * 0.20;
    return new M.VGroup(
      panel(x, y, width, height, color),
      text(title, x, y + dy, ts, color, width - 0.28, false, true),
      text(detail, x, y - dy, ds, C.ink, width - 0.28),
    );
  }

  function flow(items, { hasBox = false, connected = true } = {}) {
    const n = items.length;
    if (P) {
      const width = 6.4;
      const height = hasBox ? (n === 2 ? 1.75 : 1.45) : (n === 2 ? 2.00 : 1.65);
      const step = hasBox ? (n === 2 ? 3.10 : 2.25) : (n === 2 ? 3.60 : 2.60);
      const midY = hasBox ? -0.15 : -0.80;
      const ys = items.map((_, i) => midY + ((n - 1) / 2 - i) * step);
      const ts = hasBox ? (n === 2 ? 26 : 24) : (n === 2 ? 28 : 26);
      const ds = hasBox ? (n === 2 ? 21 : 20) : (n === 2 ? 22 : 21);
      const cards = ys.map((y, i) => tile(0, y, width, ...items[i], height, ts, ds));
      if (!connected) return cards;
      const pad = 0.10;
      const links = ys.slice(1).map((y, i) => new M.Arrow({
        start: point(0, ys[i] - height / 2 - pad),
        end: point(0, y + height / 2 + pad),
        color: C.muted,
      }));
      return [...cards, ...links];
    }
    const cx = hasBox ? CX : 0;
    const width = hasBox ? (n === 2 ? 3.50 : 2.40) : (n === 2 ? 4.30 : 3.35);
    const pitch = hasBox ? (n === 2 ? 4.30 : 3.04) : (n === 2 ? 5.30 : 4.15);
    const height = 1.50;
    const y = -0.60;
    const xs = items.map((_, i) => cx + (i - (n - 1) / 2) * pitch);
    const cards = xs.map((x, i) => tile(x, y, width, ...items[i], height));
    if (!connected) return cards;
    const pad = 0.10;
    const links = xs.slice(1).map((x, i) => new M.Arrow({
      start: point(xs[i] + width / 2 + pad, y),
      end: point(x - width / 2 - pad, y),
      color: C.muted,
    }));
    return [...cards, ...links];
  }

  function phone(accent = C.cyan, footer = 'Renews 1st of month') {
    if (P) {
      const y = -0.75;
      const ring = new M.Circle({ radius: 1.05, color: accent, strokeWidth: 3 });
      ring.setFill(C.bg, 0.92);
      ring.moveTo(point(0, y + 0.90));
      const chips = ['Jan', 'Feb', 'Mar'].map((m, i) => new M.VGroup(
        panel((i - 1) * 1.48, y - 2.30, 1.24, 0.62, accent, 0.85, 1.5),
        text(m, (i - 1) * 1.48, y - 2.30, 19, accent, 1.05, true, true),
      ));
      return new M.VGroup(
        panel(0, y, 5.20, 6.80, accent, 0.96, 2.5),
        text('MUSIC APP', 0, y + 2.65, 22, accent, 4.4, true, true),
        ring,
        text('♪', 0, y + 0.90, 64, accent),
        text('Monthly plan', 0, y - 0.72, 28, C.ink, 4.4, false, true),
        text(footer, 0, y - 1.40, 20, C.muted, 4.6),
        ...chips,
      );
    }
    const y = -0.75;
    const ring = new M.Circle({ radius: 0.72, color: accent, strokeWidth: 3 });
    ring.setFill(C.bg, 0.92);
    ring.moveTo(point(0, y + 0.55));
    return new M.VGroup(
      panel(0, y, 3.60, 4.50, accent, 0.96, 2.5),
      text('MUSIC APP', 0, y + 1.72, 18, accent, 3.1, true, true),
      ring,
      text('♪', 0, y + 0.55, 50, accent),
      text('Monthly plan', 0, y - 0.62, 24, C.ink, 3.1, false, true),
      text(footer, 0, y - 1.28, 18, C.muted, 3.2),
    );
  }

  function photo(x, y, w, h, color, round) {
    const icon = round ? '●' : '▲';
    return new M.VGroup(
      panel(x, y, w, h, color),
      text(icon, x, y, P ? 32 : 26, color, w - 0.16),
    );
  }

  function photoSort() {
    if (P) {
      const topY = 1.65;
      const top = [false, true, false, true].map((v, i) =>
        photo((i - 1.5) * 1.68, topY, 1.40, 1.15, C.ink, v));
      const arrows = [-1.75, 1.75].map(x => new M.Arrow({
        start: point(x, topY - 0.74), end: point(x, -0.68), color: C.muted,
      }));
      const boxY = -2.25;
      const leftBox = outlineBox(-1.85, boxY, 3.30, 2.75, C.violet);
      const rightBox = outlineBox(1.85, boxY, 3.30, 2.75, C.cyan);
      const heads = [
        text('Mixed pile', 0, 2.68, 20, C.muted),
        text('Group A', -1.85, boxY + 0.92, 21, C.violet, 3.0, false, true),
        text('Group B', 1.85, boxY + 0.92, 21, C.cyan, 3.0, false, true),
        text('No instructions — sorted by look', 0, -4.35, 19, C.muted, 7.2),
      ];
      const bottom = [
        photo(-2.55, boxY - 0.30, 1.26, 1.05, C.violet, false),
        photo(-1.15, boxY - 0.30, 1.26, 1.05, C.violet, false),
        photo(1.15, boxY - 0.30, 1.26, 1.05, C.cyan, true),
        photo(2.55, boxY - 0.30, 1.26, 1.05, C.cyan, true),
      ];
      return [...heads, ...top, ...arrows, leftBox, rightBox, ...bottom];
    }
    const topY = 0.40;
    const top = [false, true, false, true].map((v, i) =>
      photo((i - 1.5) * 1.55, topY, 1.25, 0.95, C.ink, v));
    const arrows = [-2.10, 2.10].map(x => new M.Arrow({
      start: point(x, topY - 0.62), end: point(x, -1.05), color: C.muted,
    }));
    const boxY = -2.22;
    const leftBox = outlineBox(-2.25, boxY, 3.60, 2.05, C.violet);
    const rightBox = outlineBox(2.25, boxY, 3.60, 2.05, C.cyan);
    const heads = [
      text('Mixed pile', 0, 1.20, 19, C.muted),
      text('Group A', -2.25, boxY + 0.68, 19, C.violet, 3.2, false, true),
      text('Group B', 2.25, boxY + 0.68, 19, C.cyan, 3.2, false, true),
    ];
    const bottom = [
      photo(-3.00, boxY - 0.26, 1.22, 0.92, C.violet, false),
      photo(-1.50, boxY - 0.26, 1.22, 0.92, C.violet, false),
      photo(1.50, boxY - 0.26, 1.22, 0.92, C.cyan, true),
      photo(3.00, boxY - 0.26, 1.22, 0.92, C.cyan, true),
    ];
    return [...heads, ...top, ...arrows, leftBox, rightBox, ...bottom];
  }

  function miniCard(r, x, y, mode, w) {
    const [name, month, hours, help] = r;
    const color = mode === 'labels' ? labelColor(r) : C.muted;
    const bits = [panel(x, y, w, cardH, color)];
    if (mode === 'names') {
      bits.push(text(name, x, y, P ? 20 : 16, C.ink, w - 0.18));
    } else {
      const sz = P ? 16 : 15;
      bits.push(text(`${name} ${MONTHS[month]}`, x, y + 0.16, sz, C.ink, w - 0.16));
      bits.push(text(`${hours} h · ${help}`, x, y - 0.16, sz,
        mode === 'labels' ? color : C.ink, w - 0.16, true));
    }
    return new M.VGroup(...bits);
  }

  function ledger(mode) {
    const w = P ? 2.18 : 1.34;
    const columns = P ? 3 : 6;
    const pitch = P ? 2.42 : 1.48;
    const rowGap = P ? 0.82 : 0.84;
    const headings = [], cards = new Map();
    MONTHS.forEach((month, i) => {
      const x = CX + (i % columns - (columns - 1) / 2) * pitch;
      const block = Math.floor(i / columns);
      const headerY = P ? (block === 0 ? 2.96 : -1.10) : 1.25;
      const firstRowY = P ? (block === 0 ? 2.24 : -1.80) : 0.56;
      headings.push(text(month, x, headerY, P ? 22 : 19, C.ink, w, false, true));
      records.filter(r => r[1] === i).forEach((r, row) => {
        cards.set(r, miniCard(r, x, firstRowY - row * rowGap, mode, w));
      });
    });
    return { headings, cards };
  }

  function fullLedger(mode) {
    const { headings, cards } = ledger(mode);
    return [...headings, ...cards.values()];
  }

  function sortedCards() {
    const w = P ? 1.74 : 1.34;
    const pitch = P ? 1.88 : 1.48;
    const rowGap = 0.84;
    const specs = P
      ? [
          { group: light, cols: 4, top: 2.22 },
          { group: middle, cols: 4, top: 0.64 },
          { group: heavy, cols: 3, top: -2.58 },
        ]
      : [
          { group: light, cols: 4, top: 0.56 },
          { group: middle, cols: 5, top: -0.84 },
          { group: heavy, cols: 6, top: -3.08 },
        ];
    const items = [];
    specs.forEach(({ group, cols, top }) => {
      const ordered = [...group].sort((a, b) => a[2] - b[2] || a[3] - b[3]);
      ordered.forEach((r, i) => {
        const row = Math.floor(i / cols);
        const count = Math.min(cols, ordered.length - row * cols);
        const x = CX + (i % cols - (count - 1) / 2) * pitch;
        items.push(miniCard(r, x, top - row * rowGap, 'features', w));
      });
    });
    return items;
  }

  function sortedHeads() {
    const ys = P ? [2.96, 1.36, -1.86] : [1.25, -0.18, -2.40];
    return [
      text('Under 5 hours', CX, ys[0], P ? 20 : 18, C.violet, Infinity, false, true),
      text('In between', CX, ys[1], P ? 18 : 17, C.muted),
      text('Around 20 hours', CX, ys[2], P ? 20 : 18, C.violet, Infinity, false, true),
    ];
  }

  function groupHighlight(which) {
    if (which === 'heavy') {
      return P
        ? outlineBox(0, -3.00, 5.74, 1.76, C.violet)
        : outlineBox(CX, -3.08, 8.98, 0.90, C.violet);
    }
    return P
      ? outlineBox(0, 2.22, 7.58, 0.90, C.violet)
      : outlineBox(CX, 0.56, 6.02, 0.90, C.violet);
  }

  function example(r, showLabel = true) {
    const [name, month, hours, help] = r;
    const verdict = showLabel ? outcome(r) : '?';
    return flow([
      [`${name} · ${MONTHS[month]}`, `${hours} h · ${help} help`, C.cyan],
      ['Rule predicts', hours < 5 ? 'Cancel' : 'Stay', C.amber],
      ['Answer key', verdict, showLabel ? labelColor(r) : C.muted],
    ], { hasBox: true });
  }

  function aliMonths(hideJune, revealGreen = false) {
    const rows = records.filter(r => r[0] === 'Ali');
    const cols = P ? 2 : 3;
    const w = P ? 3.05 : 2.45;
    const h = 1.55;
    const colPitch = P ? 3.50 : 2.75;
    const rowPitch = P ? 2.05 : 1.95;
    const topY = P ? 1.80 : 0.25;
    const head = text('Ali’s monthly hours', CX, P ? 3.00 : 1.20, P ? 22 : 20, C.muted);
    const cards = rows.map((r, i) => {
      const isJune = r[1] === 5;
      const hidden = hideJune && isJune;
      const color = hidden ? C.amber : (revealGreen && isJune ? C.green : C.cyan);
      const x = CX + (i % cols - (cols - 1) / 2) * colPitch;
      const y = topY - Math.floor(i / cols) * rowPitch;
      return tile(x, y, w, MONTHS[r[1]], hidden ? '?' : `${r[2]} h`, color, h, P ? 24 : 22, P ? 26 : 24);
    });
    return [head, ...cards];
  }

  function lightCards(labels) {
    const head = text('Light listeners (under 5 h)', CX, P ? 2.88 : 1.20, P ? 21 : 20, C.violet, Infinity, false, true);
    const w = P ? 3.28 : 3.55;
    const h = P ? 2.25 : 1.65;
    const colPitch = P ? 3.64 : 3.95;
    const rowPitch = P ? 2.75 : 2.00;
    const topY = P ? 1.15 : 0.25;
    const cards = [farah, find('Bea', 2), find('Chen', 3), dina].map((r, i) => {
      const x = CX + (i % 2 - 0.5) * colPitch;
      const y = topY - Math.floor(i / 2) * rowPitch;
      const col = labels ? labelColor(r) : C.violet;
      if (!labels) {
        return tile(x, y, w, `${r[0]} · ${MONTHS[r[1]]}`, `${r[2]} h · ${r[3]} help`, col, h, P ? 23 : 22, P ? 20 : 18);
      }
      return new M.VGroup(
        panel(x, y, w, h, col),
        text(`${r[0]} · ${MONTHS[r[1]]}`, x, y + h * 0.27, P ? 23 : 21, C.ink, w - 0.26, false, true),
        text(`${r[2]} h · ${r[3]} help`, x, y, P ? 18 : 16, C.muted, w - 0.26, true),
        text(r[4] ? 'Cancelled' : 'Stayed', x, y - h * 0.27, P ? 21 : 19, col, w - 0.26, false, true),
      );
    });
    return [head, ...cards];
  }

  const rewards = [0, 1, 1, 1];
  const estimates = [0.5, 0.5, 0.5, 0.5];
  const loss = () => estimates.reduce((sum, value, i) => sum + Math.abs(value - rewards[i]), 0) / rewards.length;
  const losses = [loss()];
  function learn(i) {
    const k = i % rewards.length;
    const old = estimates[k], reward = rewards[k];
    estimates[k] += 0.5 * (reward - old);
    losses.push(loss());
    return `${old} → ${estimates[k]}`;
  }

  function rewardTry(action, result, reward) {
    return flow([
      ['Light listener', action, C.violet],
      ['30 days later', result, reward ? C.cyan : C.pink],
      ['Reward', reward ? '1 point' : '0 points', C.amber],
    ], { hasBox: true });
  }

  function drawLoss() {
    const left = P ? -2.85 : -5.40;
    const right = P ? 3.15 : 1.40;
    const bottom = P ? -2.45 : -2.25;
    const top = P ? 2.05 : 0.75;
    const midX = (left + right) / 2;
    const midY = (top + bottom) / 2;
    const x = i => left + i / 8 * (right - left);
    const y = v => bottom + v / 0.5 * (top - bottom);
    const axes = [
      line(left, top, left, bottom, C.muted, 2.5),
      line(left, bottom, right, bottom, C.muted, 2.5),
      text('Average error', midX, P ? 2.75 : 1.25, P ? 24 : 22, C.ink, Infinity, false, true),
      text('0.5', left - (P ? 0.55 : 0.46), top, P ? 18 : 16, C.muted, Infinity, true),
      text('0.25', left - (P ? 0.62 : 0.54), midY, P ? 17 : 15, C.muted, Infinity, true),
      text('0', left - (P ? 0.42 : 0.36), bottom, P ? 18 : 16, C.muted, Infinity, true),
      text('0', left, bottom - (P ? 0.38 : 0.32), P ? 18 : 16, C.muted, Infinity, true),
      text('4', midX, bottom - (P ? 0.38 : 0.32), P ? 18 : 16, C.muted, Infinity, true),
      text('8', right, bottom - (P ? 0.38 : 0.32), P ? 18 : 16, C.muted, Infinity, true),
      text('Trials', midX, bottom - (P ? 0.90 : 0.78), P ? 21 : 19, C.ink),
    ];
    const dots = losses.map((v, i) => new M.Dot({ point: point(x(i), y(v)), radius: P ? 0.09 : 0.07, color: C.amber }));
    const segments = losses.slice(1).map((v, i) => line(x(i), y(losses[i]), x(i + 1), y(v), C.amber, 3));
    return { axes, dots, segments };
  }

  // 0–8: the renewal story and actual records.
  await until(S(0)); await frame([phone()], 'A MONTHLY MUSIC PLAN');
  await until(S(1)); await frame(flow([
    ['1 Jan', 'Plan renews', C.cyan], ['1 Feb', 'Plan renews', C.cyan], ['1 Mar', 'Plan renews', C.cyan],
  ]), 'RENEWAL DAY');
  await until(S(2)); await frame(flow([
    ['Renewal day', 'Offer a discount?', C.amber], ['Within 30 days', 'Some listeners cancel', C.pink],
  ]), 'WHO MIGHT CANCEL?', C.amber);
  await until(S(3)); await frame(flow([
    ['Renewal records', 'What can we learn?', C.cyan], ['Music app', 'What should it look for?', C.violet],
  ]), 'LEARN FROM THE RECORDS');
  await until(S(4)); await frame(fullLedger('names'), 'ONE CARD PER RENEWAL');
  await until(S(5)); await frame(null, 'JANUARY TO JUNE', C.cyan, ['20 renewals', '6 customers']);
  await until(S(6)); await frame(fullLedger('features'), 'BEFORE RENEWAL', C.cyan, [
    'First number: hours', 'Second: help requests',
  ]);
  await until(S(7)); await frame(fullLedger('labels'), 'WITHIN 30 DAYS', C.cyan, [
    ['Cyan: stayed', C.cyan], ['Pink: cancelled', C.pink],
  ]);
  await until(S(8)); await frame(null, 'COUNT THE OUTCOMES', C.cyan, [
    ['4 cancelled (pink)', C.pink], ['16 stayed (cyan)', C.cyan],
  ]);

  // 9–13: three everyday analogies.
  await until(S(9)); await frame(flow([
    ['Student', 'Practises', C.cyan], ['Photo sorter', 'Looks closely', C.violet], ['Dog', 'Tries a trick', C.amber],
  ], { connected: false }), 'THREE WAYS PEOPLE LEARN');
  await until(S(10)); await frame(flow([
    ['Guess', '8', C.ink], ['Answer key', '7', C.cyan], ['Fix mistake', '7', C.green],
  ]), 'PRACTISE WITH ANSWERS');
  await until(S(11)); await frame(photoSort(), 'SORT BY WHAT LOOKS ALIKE', C.violet);
  await until(S(12)); await frame(flow([
    ['Dog', 'Tries sitting', C.ink], ['Trainer', 'Gives a treat', C.amber], ['Dog', 'Tries sitting again', C.green],
  ]), 'LEARN FROM A TREAT', C.amber);
  await until(S(13)); await frame(fullLedger('labels'), 'BACK TO OUR RENEWALS');

  // 14–23: rule, prediction and actual label.
  await until(S(14)); await frame(null, 'WAY ONE · ANSWER KEY');
  await until(S(15)); await frame(flow([
    ['Farah · Feb', 'Cancelled', C.pink], ['Ali · Jan', 'Stayed', C.cyan],
  ], { connected: false }), 'LABEL = WHAT HAPPENED');
  await until(S(16)); await frame(flow([
    ['Ali · Jan', '20 hours', C.cyan], ['Ali · Jan', '0 help requests', C.cyan],
  ], { connected: false }), 'FEATURES = FACTS WE KNOW');
  await until(S(17)); await frame(example(farah, false), 'TRY A RULE, CHECK IT');
  await until(S(18)); await frame(null, 'THE FIVE-HOUR RULE', C.amber, ['Under 5 h → cancel', '5 h or more → stay']);
  await until(S(19)); await frame(example(farah), 'FARAH · FEBRUARY', C.green, [['Cancel = Cancel', C.green], ['Right', C.green]]);
  await until(S(20)); await frame(example(ali), 'ALI · JANUARY', C.green, [['Stay = Stay', C.green], ['Right', C.green]]);
  await until(S(21)); await frame(example(dina), 'DINA · MARCH', C.amber, [
    ['Predicted: Cancel', C.amber], ['Actual: Stay', C.cyan], ['New customer · Wrong', C.pink],
  ]);
  await until(S(22)); await frame(null, 'ERRORS SHOW WHAT TO FIX', C.amber, [
    'Check short listening', 'for new customers',
  ]);
  await until(S(23)); await frame(flow([
    ['Features', 'Hours and help', C.cyan], ['Rule', 'Makes a guess', C.amber], ['Given label', 'Checks the guess', C.green],
  ]), 'SUPERVISED LEARNING');

  // 24–36: rearrange unlabelled cards, then mask and recover one value.
  await until(S(24)); await frame(fullLedger('labels'), 'WAY TWO · NO ANSWER KEY', C.violet);
  await until(S(25)); await frame(fullLedger('features'), 'ONLY HOURS AND HELP', C.violet);
  await until(S(26)); await frame(sortedCards(), 'GROUP SIMILAR CARDS', C.violet, [], true);
  await until(S(27));
  const groupHeads = sortedHeads();
  await play(...groupHeads.map(fadeIn), ...say('GROUPS APPEAR', C.violet));
  picture.push(...groupHeads);
  await until(S(28));
  hiBox = groupHighlight('heavy');
  boxNow = fbox(['Heavy listeners', 'Ali: 18 to 22 hours'], C.violet);
  await play(fadeIn(hiBox), fadeIn(boxNow), ...say('HEAVY LISTENERS', C.violet));
  await until(S(29));
  const prevHi = hiBox, prevBox = boxNow;
  hiBox = groupHighlight('light');
  boxNow = fbox(['Light listeners', 'Farah: 1 h · all < 5 h'], C.violet);
  await play(fadeOut(prevHi), fadeOut(prevBox), fadeIn(hiBox), fadeIn(boxNow), ...say('LIGHT LISTENERS', C.violet));
  await until(S(30));
  const lastHi = hiBox, lastBox = boxNow;
  hiBox = null; boxNow = null;
  await play(fadeOut(lastHi), fadeOut(lastBox), ...say('FOUND IN THE NUMBERS', C.violet));
  await until(S(31)); await frame(aliMonths(false), 'A HIDING GAME', C.violet);
  await until(S(32)); await frame(aliMonths(true), 'HIDE ALI’S JUNE HOURS', C.violet, ['Jan–May: 18 to 22 h']);
  await until(S(33)); await frame(aliMonths(false, true), 'REVEAL JUNE', C.green, [
    'Guess: about 20 h', ['Real value: 20 h', C.green],
  ]);
  await until(S(34)); await frame(flow([
    ['Hide', 'Ali’s June hours', C.violet], ['Guess', 'About 20 h', C.amber], ['Check', '20 h in the record', C.green],
  ]), 'MAKE YOUR OWN ANSWER KEY', C.violet);
  await until(S(35)); await frame([...sortedCards(), ...sortedHeads()], 'UNSUPERVISED LEARNING', C.violet);
  await until(S(36)); await frame(flow([
    ['Hide a value', 'June hours', C.violet], ['Guess it back', 'About 20 h', C.amber], ['Check', '20 h', C.green],
  ]), 'SELF-SUPERVISED LEARNING', C.violet);

  // 37–46: imagined reward trials, using separate estimates for each action.
  await until(S(37)); await frame([phone(C.amber, 'Way 3 · Rewards')], 'WAY THREE · REWARDS', C.amber);
  await until(S(38)); await frame(flow([
    ['Renewal day', 'Choose an action', C.cyan], ['Action', 'Discount or nothing', C.amber],
  ]), 'WHAT SHOULD THE APP DO?', C.amber);
  await until(S(39)); await frame(flow([
    ['30 days later', 'Customer stayed', C.cyan], ['30 days later', 'Customer cancelled', C.pink],
  ], { hasBox: true, connected: false }), 'CHECK AFTER THIRTY DAYS', C.amber, [
    ['Stay → 1 point', C.cyan], ['Cancel → 0 points', C.pink],
  ]);
  await until(S(40)); await frame(null, 'THE POINT IS THE REWARD', C.amber, ['Stay: 1 · Cancel: 0']);
  await until(S(41)); await frame(null, 'ONE TRY AT A TIME', C.amber, [
    'Starting estimates', 'Nothing: 0.5', 'Discount: 0.5',
  ]);
  await until(S(42));
  await frame(rewardTry('Send nothing', 'Customer cancelled', 0), 'TRIAL 1', C.amber, [
    'Nothing estimate', 'Halfway toward 0', [learn(0), C.amber],
  ]);
  await until(S(43));
  await frame(rewardTry('Send a discount', 'Customer stayed', 1), 'TRIAL 2', C.amber, [
    'Discount estimate', 'Halfway toward 1', [learn(1), C.amber],
  ]);
  await until(S(44)); await frame(flow([
    ['Send nothing', 'Estimate fell to 0.25', C.muted], ['Send a discount', 'Estimate rose to 0.75', C.amber],
  ], { hasBox: true, connected: false }), 'LEAN TOWARD MORE POINTS', C.amber, [
    'For a light listener', '0.75 beats 0.25',
  ]);
  await until(S(45));
  for (let i = 2; i < 8; i++) learn(i);
  const { axes, dots, segments } = drawLoss();
  await frame([...axes, dots[0]], 'MORE IMAGINED TRIALS', C.amber, [
    'Light: discount leads', 'Heavy: both earn 1',
  ]);
  const growth = segments.map((segment, i) => new M.LaggedStart([
    new M.Create(segment, { runTime: 0.35 }), fadeIn(dots[i + 1]),
  ], { lagRatio: 0.60 }));
  await play(new M.LaggedStart(growth, { lagRatio: 0.55, runTime: 2.1 }));
  picture.push(...segments, ...dots.slice(1));
  await until(S(46)); await frame(null, 'REINFORCEMENT LEARNING', C.amber, [
    'Rewards strengthen', 'the choice that works',
  ]);

  // 47–60: comparison, use cases and a counterexample.
  const summary = () => flow([
    ['Supervised', 'Given answers', C.cyan],
    ['Unsupervised', 'Patterns in the data', C.violet],
    ['Reinforcement', 'Rewards for actions', C.amber],
  ], { connected: false });
  await until(S(47)); await frame(summary(), 'THREE WAYS TO LEARN');
  await until(S(48)); await frame(flow([
    ['Features in', 'Hours and help', C.cyan], ['Label out', 'Stay or cancel', C.green],
  ]), 'SUPERVISED · ANSWERS');
  await until(S(49)); await frame(flow([
    ['Features only', 'Hours and help', C.cyan], ['Find patterns', 'Group or fill a gap', C.violet],
  ]), 'UNSUPERVISED · PATTERNS', C.violet);
  await until(S(50)); await frame(flow([
    ['Action in', 'Discount or nothing', C.amber], ['Reward back', '1 point or 0', C.green],
  ]), 'REINFORCEMENT · REWARDS', C.amber);
  await until(S(51)); await frame(summary(), 'WHEN TO USE EACH ONE?');
  await until(S(52)); await frame(flow([
    ['Past renewals', 'We know the answers', C.cyan], ['New renewal', 'Will they cancel?', C.amber],
  ]), 'USE SUPERVISED');
  await until(S(53)); await frame(flow([
    ['Listening records', 'Hours and help only', C.cyan], ['Kinds of listeners', 'Light and heavy', C.violet],
  ]), 'USE UNSUPERVISED', C.violet);
  await until(S(54)); await frame(flow([
    ['Act now', 'Send an offer?', C.amber], ['Find out later', 'Did they stay?', C.green],
  ]), 'USE REINFORCEMENT', C.amber);
  await until(S(55)); await frame(fullLedger('labels'), 'THIS CHAPTER USES LABELS');
  await until(S(56)); await frame(lightCards(false), 'GROUPS ARE NOT LABELS', C.violet);
  await until(S(57)); await frame(null, 'FOUR LIGHT LISTENERS', C.violet, ['4 light listeners', 'Each played under 5 h']);
  await until(S(58)); await frame(lightCards(true), 'TURN COLOURS BACK ON', C.amber, [
    ['3 cancelled (pink)', C.pink], ['Dina stayed (cyan)', C.cyan],
  ]);
  await until(S(59)); await frame(null, 'GROUP ≠ PREDICTION', C.violet, [
    'Pattern: light listening', 'Outcome: from the label',
  ]);
  await until(S(60)); await frame(summary(), 'ANSWERS · PATTERNS · REWARDS', C.cyan, [], true);
}

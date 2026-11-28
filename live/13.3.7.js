// 13.3.7 Label disagreement: measuring how much workers agree.
// Beat i is sentence i, starting at zero.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const BLUE = '#60a5fa', ORANGE = '#fb923c';
  const ids = [...'ABCDEFGHIJKL'];
  const a = [...'PPPPPPPPPMMM'];
  const b = [...'PPPPPPPMPMPM'];
  const materials = { P: 'Plastic', M: 'Metal' };
  const colorOf = value => value === 'P' ? BLUE : ORANGE;
  const point = (x, y) => [x, y, 0];

  function text(s, x, y, size = 20, color = C.ink, mono = false, maxWidth = Infinity) {
    const label = T(s, size, color, mono, true);
    const width = label.getWidth();
    if (width > maxWidth) label.scale(maxWidth / width);
    return label.moveTo(point(x, y));
  }

  function rect(x, y, width, height, color, fill = C.card, opacity = 1, cornerRadius = 0.08) {
    const shape = new M.RoundedRectangle({ width, height, color, cornerRadius, strokeWidth: 2 });
    shape.setFill(fill, opacity);
    return shape.moveTo(point(x, y));
  }

  function line(x1, y1, x2, y2, color = C.muted, strokeWidth = 2) {
    return new M.Line({ start: point(x1, y1), end: point(x2, y2), color, strokeWidth });
  }

  function token(value, x, y, radius = 0.13) {
    const color = colorOf(value);
    const shape = value === 'P'
      ? new M.Circle({ radius, color, strokeWidth: 2 })
      : new M.Rectangle({ width: 2 * radius, height: 2 * radius, color, strokeWidth: 2 });
    shape.setFill(color, 0.85);
    return shape.moveTo(point(x, y));
  }

  // Phone: every view is anchored by an invisible box, enlarged, and centred in the lower frame.
  // Laptop: the same anchoring, shifted by CX, so each view fills the left part of the frame.
  function fit(parts, box, k, cy, kL = 1, cyL = -1.0, boxL = box) {
    const b = P ? box : boxL.map((v, i) => i % 2 === 0 ? v + CX : v);
    const ghost = new M.Line({ start: point(b[0], b[1]), end: point(b[2], b[3]), color: C.bg, strokeWidth: 0 });
    const g = new M.VGroup(ghost, ...parts);
    g.scale(P ? k : kL);
    g.moveTo(point(P ? 0 : CX, P ? cy : cyL));
    return g;
  }

  const fitG = (parts, ...r) => fit(parts, ...r);

  function formula(rows, color) {
    const width = P ? FW - 1.2 : 4.0;
    const pitch = P ? 0.38 : 0.42;
    const [x, y] = BOXP;
    const panel = rect(x, y, width, rows.length * pitch + 0.22, color, C.card, 0.96, 0.12);
    const labels = rows.map((row, i) => {
      const [s, ink] = Array.isArray(row) ? row : [row, C.ink];
      return text(s, x, y + ((rows.length - 1) / 2 - i) * pitch, P ? 21 : 19, ink, true, width - 0.36);
    });
    return new M.VGroup(panel, ...labels);
  }

  let viewNow = null, boxNow = null;
  async function beat({ view, rows, title, color = C.cyan }) {
    const animations = [];
    function swap(previous, next) {
      if (previous) animations.push(new M.FadeOut(previous, { runTime: 0.28 }));
      if (next) animations.push(new M.FadeIn(next, { runTime: 0.34 }));
      return next;
    }
    if (view !== undefined) viewNow = swap(viewNow, view);
    if (rows !== undefined) boxNow = swap(boxNow, rows.length ? formula(rows, color) : null);
    if (title) animations.push(...showA(title, color, PILL, P ? 19 : 17));
    await play(...animations);
  }

  function photo(id, x, y) {
    const shiny = 'HJK'.includes(id), mixed = 'IL'.includes(id);
    const ink = shiny ? '#bdccef' : mixed ? '#879ac8' : '#60749e';
    const parts = [
      rect(x, y, 0.53, 0.59, '#566ba6', '#172447', 0.96),
      rect(x, y + 0.065, 0.23, 0.26, ink, ink, 0.75, 0.045),
      text(id, x, y - 0.18, 15, C.ink, true, 0.25)
    ];
    if (shiny || mixed) parts.push(line(x - 0.07, y + 0.035, x + 0.06, y + 0.13, C.ink, shiny ? 2 : 1));
    return new M.VGroup(...parts);
  }

  function photoTable(withLabels = false, marked = []) {
    const columns = P ? 4 : 6, pitch = P ? 1.5 : 1.1;
    const x0 = CX - (columns - 1) * pitch / 2 + 0.36;
    const parts = [];
    ids.forEach((id, i) => {
      const column = i % columns;
      const x = x0 + column * pitch;
      const y = (P ? 1.16 : 0.80) - 2.30 * Math.floor(i / columns);
      if (marked.includes(id)) {
        const edge = a[i] === b[i] ? C.green : C.pink;
        parts.push(rect(x, y - 0.47, pitch - 0.035, 1.71, edge, edge, 0.12));
      }
      parts.push(photo(id, x, y));
      if (withLabels) {
        parts.push(token(a[i], x, y - 0.61), token(b[i], x, y - 1.08));
        if (column === 0) {
          const labelX = x0 - 0.80;
          parts.push(
            text('Worker A', labelX, y - 0.61, 16, C.ink, false, 0.92),
            text('Worker B', labelX, y - 1.08, 16, C.ink, false, 0.92)
          );
        }
      }
    });
    return fit(parts, [-3.2, 1.5, 3.1, -4.8], 1.2, -2.3, 1.25, -1.05, [-3.6, 1.15, 3.2, -2.8]);
  }

  function workerRows(stage) {
    const parts = [];
    const labels = stage === 'counts' ? ['9 Plastic', '3 Metal'] : ['¾ Plastic', '¼ Metal'];
    [a, b].forEach((row, i) => {
      const y = 0.64 - i * (P ? 2.9 : 1.60);
      const values = stage === 'answers' ? row : [...row].sort().reverse();
      parts.push(text(`Worker ${i === 0 ? 'A' : 'B'}`, CX - 2.40, y + 0.46, 19, C.ink, false, 1.7));
      parts.push(...values.map((v, j) => token(v, CX + (j - 5.5) * 0.52, y, 0.145)));
      if (stage !== 'answers') {
        parts.push(
          text(labels[0], CX - 0.79, y - 0.46, 20, BLUE, false, 2.0),
          text(labels[1], CX + 2.31, y - 0.46, 20, ORANGE, false, 1.34)
        );
      }
    });
    return fit(parts, [-3.5, 1.3, 3.5, -3.0], 1.12, -3.0, 1.2, -0.95, [-3.5, 1.2, 3.5, -1.7]);
  }

  const cards = ['P', 'P', 'P', 'M'];

  function card(value, x, y, width = 0.45, height = 0.58) {
    return new M.VGroup(
      rect(x, y, width, height, colorOf(value)),
      token(value, x, y, width * 0.23)
    );
  }

  function bags(stage) {
    const parts = [];
    ['A', 'B'].forEach((worker, i) => {
      const x = CX + (i - 0.5) * 3.45;
      parts.push(
        text(`Bag ${worker}`, x, 1.06, 22),
        rect(x, 0.08, 2.63, 1.44, C.line, C.card, 0.94, 0.22),
        line(x - 0.94, 0.54, x + 0.94, 0.54)
      );
      if (stage !== 'empty') {
        parts.push(...cards.map((v, j) => card(v, x + (j - 1.5) * 0.55, -0.02)));
      }
      if (stage === 'mix') {
        parts.push(text('¾ Plastic · ¼ Metal', x, -0.99, 20, C.ink, false, 2.75));
      }
      if (stage === 'draw') {
        parts.push(
          line(x, -0.64, x, -1.11, C.amber),
          rect(x, -1.45, 0.54, 0.63, C.amber),
          text('?', x, -1.45, 22, C.amber)
        );
      }
    });
    return fit(parts, [-3.2, 1.4, 3.2, -1.9], 1.2, -2.6, 1.3, -1.0);
  }

  function pairExamples() {
    const parts = ['P', 'M'].flatMap((v, i) => {
      const x = CX + (i - 0.5) * 3.45;
      return [
        text('Bag A', x - 0.62, 0.55, 18, C.muted, false, 1.1),
        text('Bag B', x + 0.62, 0.55, 18, C.muted, false, 1.1),
        card(v, x - 0.62, -0.10, 0.67, 0.76),
        card(v, x + 0.62, -0.10, 0.67, 0.76),
        text(`Both ${materials[v]}`, x, -0.89, 22, colorOf(v), false, 2.8)
      ];
    });
    return fit(parts, [-2.9, 0.85, 2.9, -1.1], 1.35, -3.0, 1.4, -0.9);
  }

  function pairGrid(stage) {
    const pitch = 0.68, x0 = CX - 0.65, y0 = 0.34;
    const x = i => x0 + i * pitch, y = i => y0 - i * pitch;
    const parts = [
      text('Bag B', x(1.5), 1.38, 19, C.muted),
      text('Bag A', x0 - 1.47, y(1.5), 19, C.muted, false, 1.14)
    ];
    cards.forEach((first, i) => {
      parts.push(token(first, x(i), y0 + pitch), token(first, x0 - pitch, y(i)));
      cards.forEach((second, j) => {
        const plastic = first === 'P' && second === 'P';
        const metal = first === 'M' && second === 'M';
        const highlighted = stage === 'row' && i === 0
          || stage === 'plastic' && plastic
          || stage === 'metal' && metal
          || stage === 'matches' && (plastic || metal);
        const filled = stage !== 'outline' && (stage !== 'row' || i === 0);
        const edge = highlighted ? (first === second ? colorOf(first) : C.muted) : C.line;
        parts.push(rect(x(j), y(i), 0.61, 0.59, edge, highlighted ? edge : C.card, highlighted ? 0.24 : 0.92, 0.05));
        if (filled) {
          parts.push(token(first, x(j) - 0.12, y(i), 0.085), token(second, x(j) + 0.12, y(i), 0.085));
        }
      });
    });
    return fit(parts, [-2.8, 1.55, 1.8, -2.05], 1.65, -2.6, 1.4, -1.05);
  }

  const EXPECTED = 5 / 8, OBSERVED = 5 / 6;

  function agreementBar({ expected, observed, gain = false, room = false } = {}) {
    const width = P ? 5.6 : 6.53, y = -0.23;
    const x = value => CX + (value - 0.5) * width;
    const parts = [
      rect(CX, y, width, 0.16, C.line, C.line, 1, 0.055),
      text('0%', x(0), y - 0.37, 18, C.muted, true, 0.45),
      text('100%', x(1), y - 0.37, 18, C.muted, true, 0.70)
    ];
    function mark(value, label, color, height) {
      const tx = Math.min(CX + 2.94, x(value));
      parts.push(
        line(x(value), y + 0.08, x(value), height - 0.22, color, 3),
        text(label, tx, height, 19, color, true, 1.38)
      );
    }
    function span(from, to, height, label, color) {
      parts.push(
        line(x(from), height, x(to), height, color, 3),
        line(x(from), height - 0.07, x(from), height + 0.07, color),
        line(x(to), height - 0.07, x(to), height + 0.07, color),
        text(label, (x(from) + x(to)) / 2, height - 0.31, 18, color, true, 1.59)
      );
    }
    if (expected !== undefined) {
      const same = observed === expected;
      const label = expected === 1 ? '100%' : '62.5%';
      mark(expected, label, same ? C.green : C.amber, same ? 0.85 : 0.48);
    }
    if (observed !== undefined && observed !== expected) {
      const label = observed === 1 ? '100%' : observed === 0.5 ? '50%' : '83.33%';
      mark(observed, label, C.cyan, 1.09);
    }
    if (gain) span(EXPECTED, OBSERVED, -0.94, '20.83 pp', C.cyan);
    if (room) span(EXPECTED, 1, gain ? -1.74 : -0.94, '37.5 pp', C.amber);
    return fit(parts, [-3.2, 1.4, 3.2, -2.1], 1.2, -3.0, 1.2, -1.0, [-3.5, 1.4, 3.5, -2.1]);
  }

  function sameMistake() {
    return fitG([
      photo('H', CX, 1.02),
      text('Worker A', CX - 1.52, 0.33, 22), text('Worker B', CX + 1.52, 0.33, 22),
      token('M', CX - 1.52, -0.15, 0.17), token('M', CX + 1.52, -0.15, 0.17),
      text('Metal', CX - 1.52, -0.60, 20, ORANGE), text('Metal', CX + 1.52, -0.60, 20, ORANGE),
      token('P', CX - 1.50, -1.46, 0.15),
      text('Actual material is Plastic', CX + 0.26, -1.46, 22, BLUE, false, 2.85)
    ], [-2.9, 1.4, 2.9, -1.8], 1.3, -2.7, 1.35, -1.0);
  }

  const plasticMatches = ids.filter((_, i) => a[i] === 'P' && a[i] === b[i]);
  const metalMatches = ids.filter((_, i) => a[i] === 'M' && a[i] === b[i]);
  const matches = [...plasticMatches, ...metalMatches];
  const legend = [['● Plastic', BLUE], ['■ Metal', ORANGE]];

  await until(S(0)); await beat({ view: photoTable(), title: '2 WORKERS · 12 PHOTOS' });
  await until(S(1)); await beat({ title: 'EACH WORKER LABELS ALONE', rows: legend });
  await until(S(2)); await beat({ title: 'HOW OFTEN DO THEY AGREE?', color: C.amber });
  await until(S(3)); await beat({ view: photoTable(true), title: 'TWO ANSWERS UNDER EACH PHOTO' });
  await until(S(4)); await beat({ view: photoTable(true, plasticMatches), title: '8 BOTH PLASTIC',
    rows: [...legend, ['8 Plastic matches', C.green]], color: C.green });
  await until(S(5)); await beat({ view: photoTable(true, metalMatches), title: '2 BOTH METAL',
    rows: [...legend, ['2 Metal matches', C.green]], color: C.green });
  await until(S(6)); await beat({ view: photoTable(true, ['H']), title: 'H · DIFFERENT ANSWERS',
    rows: [['A  Plastic', BLUE], ['B  Metal', ORANGE]], color: C.pink });
  await until(S(7)); await beat({ view: photoTable(true, ['K']), title: 'K · DIFFERENT ANSWERS',
    rows: [['A  Metal', ORANGE], ['B  Plastic', BLUE]], color: C.pink });
  await until(S(8)); await beat({ view: photoTable(true, matches), title: '10 MATCHING ANSWERS',
    rows: ['8 Plastic + 2 Metal', ['10 matches out of 12', C.green]], color: C.green });
  await until(S(9)); await beat({ rows: [['10 ÷ 12 ≈ 83.33%', C.green]], color: C.green });
  await until(S(10)); await beat({ title: 'OBSERVED AGREEMENT', color: C.green });
  await until(S(11)); await beat({ title: 'IS 83% THE WHOLE STORY?', color: C.amber });
  await until(S(12)); await beat({ view: workerRows('answers'), rows: [], title: 'LOOK AT EACH WORKER' });
  await until(S(13)); await beat({ view: workerRows('counts'), title: 'SAME LABEL COUNTS' });
  await until(S(14)); await beat({ view: workerRows('shares'), title: '¾ PLASTIC FOR EACH WORKER',
    rows: [['9 ÷ 12 = ¾', BLUE]] });
  await until(S(15)); await beat({ title: 'SOME MATCHES CAN HAPPEN BY CHANCE', color: C.amber });

  // Distinguish the individual cards before counting their possible pairs.
  await until(S(16)); await beat({ view: bags('empty'), rows: [], title: 'ONE BAG FOR EACH WORKER' });
  await until(S(17)); await beat({ view: bags('cards'), title: '3 PLASTIC AND 1 METAL IN EACH BAG', rows: legend });
  await until(S(18)); await beat({ view: bags('mix'), title: 'SAME MIX AS THE WORKERS',
    rows: ['Worker   9/12 Plastic', 'Bag      3/4 Plastic'] });
  await until(S(19)); await beat({ view: bags('draw'), rows: [], title: 'DRAW ONE CARD FROM EACH BAG' });
  await until(S(20)); await beat({ view: pairExamples(), title: 'TWO WAYS TO MATCH' });
  await until(S(21)); await beat({ view: pairGrid('outline'), title: 'A GRID OF POSSIBLE PAIRS' });
  await until(S(22)); await beat({ view: pairGrid('row'), title: 'EACH CARD CAN PAIR WITH ANY OF FOUR' });
  await until(S(23)); await beat({ view: pairGrid('all'), title: '16 EQUALLY LIKELY PAIRS', rows: ['4 × 4 = 16'] });
  await until(S(24)); await beat({ view: pairGrid('plastic'), title: 'PAIR THE PLASTIC CARDS', rows: [], color: BLUE });
  await until(S(25)); await beat({ title: '9 PLASTIC MATCHES', rows: [['3 × 3 = 9', BLUE]], color: BLUE });
  await until(S(26)); await beat({ view: pairGrid('metal'), title: '1 METAL MATCH',
    rows: [['1 × 1 = 1', ORANGE]], color: ORANGE });
  await until(S(27)); await beat({ view: pairGrid('matches'), title: '10 MATCHES OUT OF 16',
    rows: ['9 + 1 = 10 matches', '16 possible pairs'], color: C.green });
  await until(S(28)); await beat({ rows: [['10 ÷ 16 = 62.5%', C.amber]], color: C.amber });
  await until(S(29)); await beat({ title: 'EXPECTED AGREEMENT BY CHANCE',
    rows: ['Same mix in each bag', ['10 ÷ 16 = 62.5%', C.amber]], color: C.amber });

  // Both gains use the same agreement scale and the same chance baseline.
  await until(S(30)); await beat({ view: agreementBar(), rows: [], title: 'AGREEMENT FROM 0% TO 100%' });
  await until(S(31)); await beat({ view: agreementBar({ expected: EXPECTED }),
    title: 'EXPECTED AGREEMENT', rows: [['Chance    62.5%', C.amber]], color: C.amber });
  await until(S(32)); await beat({ view: agreementBar({ expected: EXPECTED, observed: OBSERVED }),
    title: 'OBSERVED AGREEMENT', rows: [['Observed ≈ 83.33%', C.cyan], ['Chance     62.5%', C.amber]] });
  await until(S(33)); await beat({ view: agreementBar({ expected: EXPECTED, observed: OBSERVED, gain: true }),
    title: 'ABOUT 20.83 PERCENTAGE POINTS', rows: ['83.33% − 62.5%', ['≈ 20.83 pp', C.cyan]] });
  await until(S(34)); await beat({ title: 'PERCENTAGE POINTS',
    rows: ['Difference between', 'two percentages', 'pp = percentage points'] });
  await until(S(35)); await beat({ title: 'HOW FAR COULD THEY GO?', rows: [], color: C.amber });
  await until(S(36)); await beat({ view: agreementBar({ expected: EXPECTED, observed: 1 }),
    title: 'PERFECT AGREEMENT', rows: ['12 matches out of 12', ['12 ÷ 12 = 100%', C.green]], color: C.green });
  await until(S(37)); await beat({ view: agreementBar({ expected: EXPECTED, observed: 1, room: true }),
    title: '37.5 POINTS OF ROOM', rows: ['100% − 62.5%', ['= 37.5 pp', C.amber]], color: C.amber });
  await until(S(38)); await beat({ view: agreementBar({ expected: EXPECTED, observed: OBSERVED, gain: true, room: true }),
    title: 'ACTUAL GAIN AND POSSIBLE GAIN', rows: [['Actual   ≈ 20.83 pp', C.cyan], ['Possible   37.5 pp', C.amber]] });
  await until(S(39)); await beat({ title: 'DIVIDE ACTUAL BY POSSIBLE',
    rows: [['About 20.83 pp', C.cyan], ['÷ 37.5 pp', C.amber]] });
  await until(S(40)); await beat({ rows: ['(5/6 − 5/8) ÷ (1 − 5/8)', ['= 5/9 ≈ 0.56', C.green]], color: C.green });
  await until(S(41)); await beat({ title: 'A LITTLE MORE THAN HALF',
    rows: ['½ = 0.50', ['5/9 ≈ 0.56', C.green]], color: C.green });
  await until(S(42)); await beat({ title: 'COHEN’S KAPPA', rows: [['Cohen’s kappa ≈ 0.56', C.green]], color: C.green });
  await until(S(43)); await beat({ title: 'THE CALCULATION IN ONE FORMULA',
    rows: [['Actual gain beyond chance', C.cyan], ['÷ Possible gain', C.amber]] });
  await until(S(44)); await beat({ rows: ['Kappa =', ['(observed − expected)', C.cyan], ['÷ (1 − expected)', C.amber]] });
  await until(S(45)); await beat({ title: 'WRITE PERCENTAGES AS PARTS OF ONE',
    rows: ['100% = 1', '62.5% = 5/8', ['(5/6 − 5/8) ÷ (1 − 5/8)', C.green]] });

  await until(S(46)); await beat({ view: agreementBar({ expected: EXPECTED, observed: 1, room: true }),
    title: 'KAPPA = 1 · PERFECT AGREEMENT', rows: ['(1 − 5/8) ÷ (1 − 5/8)', ['Kappa = 1', C.green]], color: C.green });
  await until(S(47)); await beat({ view: agreementBar({ expected: EXPECTED, observed: EXPECTED }),
    title: 'KAPPA = 0 · AGREEMENT AT CHANCE', rows: ['Observed = expected', ['Kappa = 0', C.amber]], color: C.amber });
  await until(S(48)); await beat({ view: agreementBar({ expected: EXPECTED, observed: 0.5 }),
    title: 'NEGATIVE KAPPA · BELOW CHANCE', rows: ['Example  50% < 62.5%', ['Kappa < 0', C.pink]], color: C.pink });
  await until(S(49)); await beat({ view: agreementBar({ expected: 1, observed: 1 }),
    title: 'BOTH ALWAYS USE THE SAME LABEL', rows: ['Expected   100%', 'Observed   100%', ['Room   0 pp', C.amber]], color: C.amber });
  await until(S(50)); await beat({ title: 'KAPPA HAS NO DEFINED VALUE',
    rows: ['1 − expected = 1 − 1 = 0', ['(1 − 1) ÷ 0 is undefined', C.pink]], color: C.pink });
  await until(S(51)); await beat({ view: photoTable(true, matches), title: 'HOW CONSISTENTLY DO THEY LABEL?',
    rows: ['10 matches out of 12', ['Cohen’s kappa ≈ 0.56', C.green]], color: C.green });
  await until(S(52)); await beat({ view: photoTable(true, ['H', 'K']), title: 'CHECK THE MATERIAL INSTRUCTIONS',
    rows: ['Review the disputed photos', ['H and K', C.pink]], color: C.amber });
  await until(S(53)); await beat({ view: sameMistake(), title: 'EXAMPLE · BOTH MAKE THE SAME MISTAKE',
    rows: [['Both say Metal', ORANGE], ['H is Plastic', BLUE]], color: C.amber });
  await until(S(54)); await beat({ view: agreementBar({ expected: EXPECTED, observed: OBSERVED, gain: true, room: true }),
    title: 'SHARE OF POSSIBLE AGREEMENT BEYOND CHANCE',
    rows: ['Actual gain ÷ Possible gain', ['Cohen’s kappa ≈ 0.56', C.green]], color: C.green });
}

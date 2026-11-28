// 17.3.1 Image tensors: a place for every reading. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;
  const G = [[4, 4, 4, 4], [4, 4, 1, 1], [4, 4, 1, 1], [4, 4, 4, 4]];
  const RED = '#f87171', GRN = C.green, BLU = '#60a5fa', CH = [RED, GRN, BLU], CHN = ['RED', 'GREEN', 'BLUE'];
  const say = (s, c = C.cyan) => showA(s, c);
  let BOXP = P ? [0, -3.75, 0] : [3.95, -0.6, 0];

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
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };
  const rect = (x0, y0, x1, y1, color, w = 3) => {
    const r = new M.Rectangle({ width: x1 - x0, height: y1 - y0, color, strokeWidth: w });
    r.moveTo([(x0 + x1) / 2, (y0 + y1) / 2, 0]); return r;
  };

  // ---- the tile picture (camera view) ----
  const BC = P ? [0.25, -0.35, 0] : [-1.7, -0.9, 0], BS = P ? 0.95 : 0.95;
  const bpos = (r, c) => [BC[0] + (c - 1.5) * BS, BC[1] + (1.5 - r) * BS, 0];
  const shade = v => v === 4 ? '#c9d2e6' : '#3b4566';
  const tile = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const q = new M.Rectangle({ width: BS, height: BS, color: shade(G[r][c]), strokeWidth: 1 });
    q.setFill(shade(G[r][c]), 1); q.moveTo(bpos(r, c)); tile.push(q);
  }
  const bx0 = BC[0] - 2 * BS, bx1 = BC[0] + 2 * BS, by0 = BC[1] - 2 * BS, by1 = BC[1] + 2 * BS;
  const border = rect(bx0, by0, bx1, by1, C.muted, 2);

  await until(S(0)); await play(new M.LaggedStart(tile.map(q => new M.FadeIn(q)), { lagRatio: 0.04, runTime: 1.2 }), new M.Create(border), ...say('A CERAMIC TILE'));
  const chip = rect(BC[0], BC[1] - BS, bx1, BC[1] + BS, C.pink, 4);
  await until(S(1)); await play(new M.Create(chip), ...say('A SMALL CHIP', C.pink));

  // camera viewfinder corners
  const m = 0.14, k = 0.45, corners = [];
  for (const [x, y, sx, sy] of [[bx0 - m, by1 + m, 1, -1], [bx1 + m, by1 + m, -1, -1], [bx0 - m, by0 - m, 1, 1], [bx1 + m, by0 - m, -1, 1]]) {
    corners.push(new M.Line({ start: [x, y, 0], end: [x + sx * k, y, 0], color: C.cyan, strokeWidth: 4 }));
    corners.push(new M.Line({ start: [x, y, 0], end: [x, y + sy * k, 0], color: C.cyan, strokeWidth: 4 }));
  }
  await until(S(2)); await play(new M.LaggedStart(corners.map(l => new M.Create(l)), { lagRatio: 0.1, runTime: 1.2 }), ...say('THE CAMERA LOOKS AT THE TILE'));
  await until(S(3)); await play(...say('WHERE IS THE CHIP?', C.amber));
  await until(S(4)); await play(new M.FadeOut(chip), ...say('A SMALL PICTURE OF THE TILE'));

  // 5-13 pixels, rows, columns
  const glines = [];
  for (let i = 1; i < 4; i++) {
    glines.push(new M.Line({ start: [bx0 + i * BS, by0, 0], end: [bx0 + i * BS, by1, 0], color: C.cyan, strokeWidth: 2 }));
    glines.push(new M.Line({ start: [bx0, by0 + i * BS, 0], end: [bx1, by0 + i * BS, 0], color: C.cyan, strokeWidth: 2 }));
  }
  await until(S(5)); await play(new M.LaggedStart(glines.map(l => new M.Create(l)), { lagRatio: 0.12, runTime: 1.4 }), ...say('16 SMALL SQUARES'));
  const px = rect(bx0, by1 - BS, bx0 + BS, by1, C.amber, 4);
  await until(S(6)); await play(new M.Create(px), ...say('1 SQUARE = 1 PIXEL', C.amber));
  await until(S(7)); await play(new M.FadeOut(px), ...say('4 LINES ACROSS'));
  const rowBox = rect(bx0 - 0.05, by1 - BS, bx1 + 0.05, by1, C.amber, 4);
  await until(S(8)); await play(new M.Create(rowBox), ...say('ROW = A LINE ACROSS  →', C.amber));
  const rowNums = [0, 1, 2, 3].map(r => { const t = T(String(r + 1), P ? 17 : 18, C.amber, true); t.moveTo([bx0 - 0.3, bpos(r, 0)[1], 0]); return t; });
  await until(S(9)); await play(new M.FadeOut(rowBox), new M.LaggedStart(rowNums.map(t => new M.FadeIn(t)), { lagRatio: 0.25, runTime: 1.4 }), ...say('ROWS 1 TO 4, TOP TO BOTTOM', C.amber));
  const colBox = rect(bx0, by0 - 0.05, bx0 + BS, by1 + 0.05, C.violet, 4);
  await until(S(10)); await play(new M.Create(colBox), ...say('COLUMN = A LINE DOWN  ↓', C.violet));
  const colNums = [0, 1, 2, 3].map(c => { const t = T(String(c + 1), P ? 17 : 18, C.violet, true); t.moveTo([bpos(0, c)[0], by1 + 0.32, 0]); return t; });
  await until(S(11)); await play(new M.FadeOut(colBox), new M.LaggedStart(colNums.map(t => new M.FadeIn(t)), { lagRatio: 0.25, runTime: 1.4 }), ...say('COLUMNS 1 TO 4, LEFT TO RIGHT', C.violet));
  await until(S(12)); await play(...say('4 ROWS × 4 COLUMNS'), ...fbox(['4 rows', '4 columns', ['16 pixels', C.cyan]]));
  await until(S(13)); await play(new M.LaggedStart(tile.map(q => new M.Indicate(q, { color: C.amber })), { lagRatio: 0.08, runTime: 2.0 }), ...say('EVERY PIXEL HAS ITS OWN PLACE', C.amber));
  await until(S(14)); await play(...say('WHAT DOES THE CAMERA MEASURE?', C.amber), ...dropBox());

  // 15-18 three readings per pixel (row 2, column 2)
  const pix = rect(bpos(1, 1)[0] - BS / 2, bpos(1, 1)[1] - BS / 2, bpos(1, 1)[0] + BS / 2, bpos(1, 1)[1] + BS / 2, C.amber, 5);
  await until(S(15)); await play(new M.Create(pix), ...say('3 NUMBERS FOR EVERY PIXEL'), ...fbox(['row 2, column 2', ['red   = ?', RED], ['green = ?', GRN], ['blue  = ?', BLU]]));
  await until(S(16)); await play(...say('RED LIGHT', RED), ...fbox(['row 2, column 2', ['red   = 4', RED], ['green = ?', GRN], ['blue  = ?', BLU]]));
  await until(S(17)); await play(...say('GREEN LIGHT', GRN), ...fbox(['row 2, column 2', ['red   = 4', RED], ['green = 4', GRN], ['blue  = ?', BLU]]));
  await until(S(18)); await play(...say('BLUE LIGHT', BLU), ...fbox(['row 2, column 2', ['red   = 4', RED], ['green = 4', GRN], ['blue  = 4', BLU]]));

  // 19-27 three channel grids
  const CS = P ? 0.62 : 0.45, CYs = P ? [0.75, 0.75, -2.6] : [-0.5, -0.5, -0.5], CXs = P ? [-1.85, 1.85, 0] : [-5.0, -2.6, -0.2];
  const cpos = (k, r, c) => [CXs[k] + (c - 1.5) * CS, CYs[k] + (1.5 - r) * CS, 0];
  const cells = [], nums = [], chLab = [], chCol = [], chRow = [];
  for (let k = 0; k < 3; k++) {
    cells.push([]); nums.push([]);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const q = new M.Rectangle({ width: CS, height: CS, color: CH[k], strokeWidth: 2 });
      q.setFill(C.card, 0.95); q.moveTo(cpos(k, r, c)); cells[k].push(q);
      const t = T(String(G[r][c]), P ? 18 : 15, G[r][c] === 1 ? C.pink : C.ink, true); t.moveTo(cpos(k, r, c)); nums[k].push(t);
    }
    const lb = T(`${k + 1} ${CHN[k]}`, P ? 16 : 15, CH[k], true); lb.moveTo([CXs[k], CYs[k] - 2 * CS - 0.35, 0]); chLab.push(lb);
    for (let c = 0; c < 4; c++) { const t = T(String(c + 1), P ? 15 : 13, C.violet, true); t.moveTo([cpos(k, 0, c)[0], CYs[k] + 2 * CS + (P ? 0.25 : 0.2), 0]); chCol.push(t); }
    for (let r = 0; r < 4; r++) { const t = T(String(r + 1), P ? 15 : 13, C.amber, true); t.moveTo([CXs[k] - 2 * CS - (P ? 0.25 : 0.2), cpos(k, r, 0)[1], 0]); chRow.push(t); }
  }
  await until(S(19)); if (P) BOXP = [0, -5.85, 0];
  const moves = [];
  for (let k = 0; k < 3; k++) for (let i = 0; i < 16; i++) moves.push(new M.TransformFromCopy(tile[i], cells[k][i]));
  await play(new M.LaggedStart(moves, { lagRatio: 0.02, runTime: 2.2 }), new M.FadeOut(new M.VGroup(...tile, border, ...glines, ...corners, ...rowNums, ...colNums, pix)), ...dropBox(), ...say('3 GRIDS, LIKE 3 SHEETS OF PAPER'));
  await until(S(20)); await play(new M.FadeIn(new M.VGroup(...nums.flat(), ...chCol, ...chRow)), ...say('SAME PLACES IN EVERY GRID'));
  await until(S(21)); await play(new M.FadeIn(new M.VGroup(...chLab)), ...say('1 COLOR GRID = 1 CHANNEL', C.violet));
  for (let k = 0; k < 3; k++) {
    await until(S(22 + k));
    await play(new M.LaggedStart(cells[k].map(q => new M.Indicate(q, { color: CH[k] })), { lagRatio: 0.03, runTime: 1.2 }), ...say(`CHANNEL ${k + 1} = ${CHN[k]}`, CH[k]));
  }
  await until(S(25)); await play(...say('HERE: ALL 3 CHANNELS HAVE THE SAME NUMBERS'));
  const idx = v => { const a = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (G[r][c] === v) a.push(r * 4 + c); return a; };
  await until(S(26)); await play(new M.LaggedStart([0, 1, 2].flatMap(k => idx(4).map(i => new M.Indicate(nums[k][i], { color: C.ink }))), { lagRatio: 0.02, runTime: 1.6 }), ...say('BRIGHT GLAZE = 4'));
  await until(S(27)); await play(new M.LaggedStart([0, 1, 2].flatMap(k => idx(1).map(i => new M.Indicate(cells[k][i], { color: C.pink }))), { lagRatio: 0.06, runTime: 1.6 }), ...say('DARK CHIP = 1', C.pink));
  await until(S(28)); await play(...say('3 GRIDS TOGETHER = IMAGE TENSOR', C.green), ...fbox([['image tensor', C.green], '= 3 grids of', '  numbers'], C.green));

  // 29 a stack of sheets (small picture in the box area)
  const sheets = [2, 1, 0].map(k => {
    const s = P ? 1.3 : 1.5, d = P ? 0.28 : 0.3;
    const r = new M.RoundedRectangle({ width: s, height: s, cornerRadius: 0.1, color: CH[k], strokeWidth: 3 });
    r.setFill(C.card, 0.97); r.moveTo([BOXP[0] + (k - 1) * d, BOXP[1] - (k - 1) * d, 0]);
    const t = T(String(k + 1), 18, CH[k], true); t.moveTo([BOXP[0] + (k - 1) * d - s / 2 + 0.22, BOXP[1] - (k - 1) * d + s / 2 - 0.22, 0]);
    return new M.VGroup(r, t);
  });
  await until(S(29)); await play(...dropBox(), new M.LaggedStart(sheets.map(g => new M.FadeIn(g)), { lagRatio: 0.3, runTime: 1.2 }), ...say('A STACK OF NUMBERED GRIDS', C.green));
  await until(S(30)); await play(new M.FadeOut(new M.VGroup(...sheets)), ...say('HOW DO WE FIND ONE READING?', C.amber));

  // 31-39 find a reading
  await until(S(31)); await play(...say('GREEN · ROW 2 · COLUMN 3', C.green), ...fbox(['find the green', 'reading at', ['row 2, column 3', C.amber]]));
  const rowOut = [0, 1, 2].map(k => rect(CXs[k] - 2 * CS - 0.05, cpos(k, 1, 0)[1] - CS / 2, CXs[k] + 2 * CS + 0.05, cpos(k, 1, 0)[1] + CS / 2, C.amber, 3));
  await until(S(32)); await play(new M.LaggedStart(rowOut.map(r => new M.Create(r)), { lagRatio: 0.2, runTime: 1.2 }), new M.Indicate(chRow[1], { color: C.amber }), ...say('ROW 2: COUNT FROM THE TOP', C.amber));
  const colOut = [0, 1, 2].map(k => rect(cpos(k, 0, 2)[0] - CS / 2, CYs[k] - 2 * CS - 0.05, cpos(k, 0, 2)[0] + CS / 2, CYs[k] + 2 * CS + 0.05, C.violet, 3));
  await until(S(33)); await play(new M.LaggedStart(colOut.map(r => new M.Create(r)), { lagRatio: 0.2, runTime: 1.2 }), ...say('COLUMN 3: COUNT FROM THE LEFT', C.violet));
  const chOut = rect(CXs[1] - 2 * CS - 0.12, CYs[1] - 2 * CS - 0.12, CXs[1] + 2 * CS + 0.12, CYs[1] + 2 * CS + 0.12, C.green, 4);
  await until(S(34)); await play(new M.Create(chOut), new M.Indicate(chLab[1], { color: C.green }), ...say('CHANNEL 2 = GREEN', C.green));
  const mk = (c) => rect(cpos(1, 1, c)[0] - CS / 2 - 0.03, cpos(1, 1, c)[1] - CS / 2 - 0.03, cpos(1, 1, c)[0] + CS / 2 + 0.03, cpos(1, 1, c)[1] + CS / 2 + 0.03, C.amber, 6);
  const marker = mk(2);
  await until(S(35)); await play(new M.FadeOut(new M.VGroup(...rowOut, ...colOut)), new M.Create(marker), new M.Flash(nums[1][6], { color: C.amber }), ...say('THE READING IS 1', C.amber), ...fbox(['row 2, column 3,', 'channel 2', ['reading = 1', C.amber]]));
  await until(S(36)); await play(new M.Transform(marker, mk(1)), ...say('ONE PIXEL TO THE LEFT  ←'));
  await until(S(37)); await play(...fbox(['row 2, column 2,', 'channel 2', ['reading = ?', C.amber]]));
  await until(S(38)); await play(new M.Flash(nums[1][5], { color: C.amber }), ...say('THE READING IS 4', C.amber), ...fbox(['row 2, column 2,', 'channel 2', ['reading = 4', C.amber]]));
  await until(S(39)); await play(new M.FadeOut(new M.VGroup(marker, chOut)), ...say('ROW + COLUMN + CHANNEL → ANY READING', C.green), ...fbox(['(row, column,', ' channel)', ['→ one reading', C.green]], C.green));

  // 40-47 counting
  await until(S(40)); await play(...say('HOW MANY READINGS?', C.amber), ...dropBox());
  await until(S(41)); await play(new M.LaggedStart(cells[0].slice(0, 4).map(q => new M.Indicate(q, { color: C.amber })), { lagRatio: 0.2, runTime: 1.2 }), ...fbox([['1 row = 4 pixels', C.amber]]));
  await until(S(42)); await play(new M.LaggedStart(cells[0].map(q => new M.Indicate(q, { color: C.amber })), { lagRatio: 0.06, runTime: 1.8 }), ...fbox(['4 rows × 4 pixels', ['= 16 pixels', C.amber]]));
  await until(S(43)); await play(...fbox(['1 channel', ['= 16 readings', C.amber]]), ...say('16 READINGS PER CHANNEL'));
  await until(S(44)); await play(new M.LaggedStart([0, 1, 2].map(k => new M.LaggedStart(cells[k].map(q => new M.Indicate(q, { color: CH[k] })), { lagRatio: 0.03 })), { lagRatio: 0.5, runTime: 3.0 }),
    ...fbox(['16 + 16 + 16', ['= 48 readings', C.amber]]), ...say('3 CHANNELS = 48 READINGS', C.amber));
  await until(S(45)); await play(...say('THE SIZE IN ONE SHORT LINE'));
  await until(S(46)); await play(...fbox([['4 × 4 × 3', C.cyan], 'rows × columns', '× channels']));
  await until(S(47)); await play(...fbox(['4 × 4 × 3', ['= 48 readings', C.amber]], C.amber), ...say('MULTIPLY: ROWS × COLUMNS × CHANNELS', C.amber));
  await until(S(48)); await play(...say('EVERY READING KEEPS ITS PLACE', C.green));

  // 49 into a neural network
  const N = net(P ? { layers: [4, 3, 1], center: [0, -5.5, 0], width: 5.2, height: 1.6, r: 0.22 }
                  : { layers: [4, 3, 1], center: [3.95, -0.6, 0], width: 3.0, height: 2.4, r: 0.2 });
  const outT = T('chipped?', P ? 15 : 16, C.amber); const op = N.pos(2, 0); outT.moveTo([op[0], op[1] - 0.5, 0]);
  await until(S(49)); await play(...dropBox(), new M.FadeIn(N.group), new M.FadeIn(outT), ...say('READINGS → NEURAL NETWORK', C.violet));
  for (const l of [0, 1]) {
    const R = P ? 0.22 : 0.2, ds = [], ts = [];
    N.edges[l].forEach((row, i) => row.forEach((_, j) => {
      const a = N.pos(l, i), b = N.pos(l + 1, j);
      const d = new M.Dot({ point: [a[0] + R, a[1], 0], radius: 0.07, color: C.amber }); d.setFill(C.amber, 1);
      const t = new M.Dot({ point: [b[0] - R, b[1], 0], radius: 0.07, color: C.amber }); t.setFill(C.amber, 1);
      ds.push(d); ts.push(t);
    }));
    await play(...ds.map(d => new M.FadeIn(d, { runTime: 0.15 })));
    await play(...ds.map((d, k) => new M.Transform(d, ts[k], { runTime: 0.8 })));
    await play(new M.FadeOut(new M.VGroup(...ds), { runTime: 0.25 }));
  }

  // 50-52 careful + summary
  await until(S(50)); await play(new M.FadeOut(new M.VGroup(N.group, outT)), ...say('CAREFUL: EQUAL CHANNELS ONLY IN OUR EXAMPLE', C.pink));
  await until(S(51)); await play(...fbox(['a colored tile:', 'same pixel,', ['red ≠ green ≠ blue', C.pink]], C.pink));
  await until(S(52)); await play(...say('TENSOR SIZE = ROWS × COLUMNS × CHANNELS', C.green), ...fbox([['image tensor', C.green], '4 × 4 × 3', ['= 48 readings', C.amber]], C.green));
}

// 17.3.2 Convolution filters: finding edges in an image. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;
  const G = [[4, 4, 4, 4], [4, 4, 1, 1], [4, 4, 1, 1], [4, 4, 4, 4]];
  const FM = [[0, 0, 0], [0, 3, 0], [0, 3, 0], [0, 0, 0]];
  const say = (s, c = C.cyan) => showA(s, c);
  const BOXP = P ? [0, -5.4, 0] : [4.4, -0.6, 0];

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
    const maxw = P ? FW - 1.2 : 3.8;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const dropBox = () => { const a = boxNow ? [new M.FadeOut(boxNow)] : []; boxNow = null; return a; };
  const rect = (x0, y0, x1, y1, color, w = 3) => {
    const r = new M.Rectangle({ width: x1 - x0, height: y1 - y0, color, strokeWidth: w });
    r.moveTo([(x0 + x1) / 2, (y0 + y1) / 2, 0]); return r;
  };

  // tile in the camera view
  const BC = P ? [0.2, 0.2, 0] : [-4.4, -0.6, 0], BS = P ? 1.0 : 0.72;
  const bpos = (r, c) => [BC[0] + (c - 1.5) * BS, BC[1] + (1.5 - r) * BS, 0];
  const shade = v => v === 4 ? '#3a4a78' : '#151b33';
  const bx0 = BC[0] - 2 * BS, bx1 = BC[0] + 2 * BS, by0 = BC[1] - 2 * BS, by1 = BC[1] + 2 * BS;
  const tile = [], nums = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const q = new M.Rectangle({ width: BS, height: BS, color: C.muted, strokeWidth: 1 });
    q.setFill(shade(G[r][c]), 1); q.moveTo(bpos(r, c)); tile.push(q);
    const t = T(String(G[r][c]), P ? 22 : 19, G[r][c] === 4 ? C.ink : C.pink, true); t.moveTo(bpos(r, c)); nums.push(t);
  }
  const m = 0.14, k = 0.4, corners = [];
  for (const [x, y, sx, sy] of [[bx0 - m, by1 + m, 1, -1], [bx1 + m, by1 + m, -1, -1], [bx0 - m, by0 - m, 1, 1], [bx1 + m, by0 - m, -1, 1]]) {
    corners.push(new M.Line({ start: [x, y, 0], end: [x + sx * k, y, 0], color: C.cyan, strokeWidth: 4 }));
    corners.push(new M.Line({ start: [x, y, 0], end: [x, y + sy * k, 0], color: C.cyan, strokeWidth: 4 }));
  }
  const rowNums = [0, 1, 2, 3].map(r => { const t = T(String(r + 1), 16, C.amber, true); t.moveTo([bx0 - 0.42, bpos(r, 0)[1], 0]); return t; });

  await until(S(0)); await play(new M.LaggedStart(tile.map(q => new M.FadeIn(q)), { lagRatio: 0.04, runTime: 1.2 }), new M.LaggedStart(corners.map(l => new M.Create(l)), { lagRatio: 0.1, runTime: 1.2 }), ...say('FIND THE CHIP ON THE TILE'));
  await until(S(1)); await play(...say('WHERE DOES SMOOTH MEET CHIP?', C.amber));
  await until(S(2)); await play(new M.LaggedStart(rowNums.map(t => new M.FadeIn(t)), { lagRatio: 0.2, runTime: 1 }), ...say('4 ROWS × 4 COLUMNS'));
  await until(S(3)); await play(...say('3 CHANNELS, SAME READINGS'), ...fbox([['red', '#f87171'], ['= green', C.green], ['= blue', '#60a5fa']]));
  await until(S(4)); await play(...say('SO USE JUST 1 CHANNEL', C.green), ...fbox(['one channel', 'is enough']));
  const idx = v => { const a = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (G[r][c] === v) a.push(r * 4 + c); return a; };
  await until(S(5)); await play(...dropBox(), new M.LaggedStart(idx(4).map(i => new M.FadeIn(nums[i])), { lagRatio: 0.06, runTime: 1.2 }), ...say('BRIGHT = 4'));
  await until(S(6)); await play(new M.LaggedStart(idx(1).map(i => new M.FadeIn(nums[i])), { lagRatio: 0.15, runTime: 1 }), ...say('DARK = 1', C.pink));
  const rowBox = rect(bx0 - 0.05, bpos(1, 0)[1] - BS / 2, bx1 + 0.05, bpos(1, 0)[1] + BS / 2, C.amber, 3);
  await until(S(7)); await play(new M.Create(rowBox), new M.Indicate(rowNums[1], { color: C.amber }), ...say('ROW 2', C.amber));
  await until(S(8)); await play(new M.LaggedStart([4, 5, 6, 7].map(i => new M.Indicate(nums[i], { color: C.amber })), { lagRatio: 0.4, runTime: 2.4 }), ...fbox(['row 2:', ['4  4  1  1', C.amber]]));
  const edgeX = bx0 + 2 * BS;
  const edgeLn = new M.Line({ start: [edgeX, bpos(1, 0)[1] + BS / 2 + 0.1, 0], end: [edgeX, bpos(1, 0)[1] - BS / 2 - 0.1, 0], color: C.pink, strokeWidth: 6 });
  await until(S(9)); await play(new M.Create(edgeLn), ...say('BRIGHT MEETS DARK HERE', C.pink));
  await until(S(10)); await play(new M.Indicate(edgeLn, { color: C.pink }), ...say('A CHANGE IN BRIGHTNESS = AN EDGE', C.pink));
  await until(S(11)); await play(new M.FadeOut(edgeLn), ...say('COMPARE 2 NEIGHBOR PIXELS'));

  // the filter window
  const win = c => rect(bpos(1, c)[0] - BS / 2 - 0.04, bpos(1, c)[1] - BS / 2 - 0.04, bpos(1, c + 1)[0] + BS / 2 + 0.04, bpos(1, c)[1] + BS / 2 + 0.04, C.green, 6);
  const window = win(0);
  await until(S(12)); await play(new M.FadeOut(rowBox), new M.Create(window), ...say('A WINDOW OVER 2 PIXELS', C.green), ...dropBox());
  await until(S(13)); await play(...say('EACH PIXEL GETS A NUMBER'), ...fbox(['left pixel  × ?', 'right pixel × ?']));
  await until(S(14)); await play(...say('THESE NUMBERS = WEIGHTS', C.violet));
  await until(S(15)); await play(...say('LEARNED FROM EARLIER EXAMPLES', C.violet));
  await until(S(16)); await play(...fbox([['left weight  =  1', C.cyan], ['right weight = −1', C.pink]]), ...say('LEFT 1, RIGHT −1'));
  await until(S(17)); await play(...fbox(['filter (kernel)', ['[ 1, −1 ]', C.amber]], C.amber), ...say('FILTER = KERNEL', C.amber));
  await until(S(18)); await play(...say('HOW DOES IT FIND AN EDGE?'));
  await until(S(19)); await play(new M.Indicate(window, { color: C.green }), ...say('ROW 2, COLUMNS 1 AND 2', C.green));
  await until(S(20)); await play(...dropBox(), new M.Indicate(nums[4], { color: C.amber }), new M.Indicate(nums[5], { color: C.amber }), ...say('BOTH READINGS = 4'));

  // the filter as a tiny network
  const N = net(P ? { layers: [2, 1], center: [0, -3.0, 0], width: 3.4, height: 1.3, r: 0.32 }
                  : { layers: [2, 1], center: [0.1, -0.6, 0], width: 2.6, height: 1.9, r: 0.3 });
  const p00 = N.pos(0, 0), p01 = N.pos(0, 1), p1 = N.pos(1, 0);
  const wl = (p, s, c, dy) => { const t = T(s, P ? 16 : 17, c, true, true); t.moveTo([(p[0] + p1[0]) / 2, (p[1] + p1[1]) / 2 + dy, 0]); return t; };
  // signal pulses: dots travel along the two lines (leave no marks behind)
  async function flow(...anims) {
    const R = 0.3, ds = [], ts = [];
    [0, 1].forEach(i => {
      const a = N.pos(0, i), b = N.pos(1, 0);
      const d = new M.Dot({ point: [a[0] + R, a[1], 0], radius: 0.08, color: C.amber }); d.setFill(C.amber, 1);
      const t = new M.Dot({ point: [b[0] - R, b[1], 0], radius: 0.08, color: C.amber }); t.setFill(C.amber, 1);
      ds.push(d); ts.push(t);
    });
    await play(...ds.map(d => new M.FadeIn(d, { runTime: 0.15 })), ...anims);
    await play(...ds.map((d, k) => new M.Transform(d, ts[k], { runTime: 0.8 })));
    await play(new M.FadeOut(new M.VGroup(...ds), { runTime: 0.25 }));
  }
  const wA = wl(p00, '×1', C.cyan, 0.28), wB = wl(p01, '×−1', C.pink, -0.28);
  await until(S(21)); await play(new M.FadeIn(N.group), ...say('READINGS INTO CIRCLES'));
  await play(...N.value(0, 0, '4'), ...N.value(0, 1, '4'));
  await until(S(22)); await play(new M.Indicate(N.nodes[1][0], { color: C.amber }), ...say('ONE CIRCLE ON THE RIGHT', C.amber));
  await until(S(23)); await play(...N.weight(0, 0, 0, 1), new M.FadeIn(wA), ...say('UPPER LINE: WEIGHT 1', C.cyan));
  await until(S(24)); await play(...N.weight(0, 1, 0, -1), new M.FadeIn(wB), ...say('LOWER LINE: WEIGHT −1', C.pink));
  await until(S(25)); await flow(...say('READING × WEIGHT'));
  await until(S(26)); await play(...fbox(['4 × 1  = 4']));
  await until(S(27)); await play(...fbox(['4 × 1  = 4', '4 × −1 = −4']));
  await until(S(28)); await flow(...say('THE RIGHT CIRCLE ADDS', C.amber));
  await until(S(29)); await play(...N.value(1, 0, '0', C.amber), ...fbox(['4 × 1  = 4', '4 × −1 = −4', ['4 + (−4) = 0', C.amber]]));
  await until(S(30)); await play(new M.Indicate(N.nodes[1][0], { color: C.amber }), ...say('FILTER SCORE = 0', C.amber));
  await until(S(31)); await play(...say('0 = EQUAL BRIGHTNESS'));

  // window 2
  await until(S(32)); await play(new M.Transform(window, win(1)), ...say('MOVE ONE PIXEL RIGHT  →', C.green), ...dropBox(), ...N.value(1, 0, ''));
  await until(S(33)); await play(...N.value(0, 0, '4'), ...N.value(0, 1, '1', C.pink), ...say('READINGS: 4 AND 1'));
  await until(S(34)); await play(new M.Indicate(wA, { color: C.cyan }), new M.Indicate(wB, { color: C.pink }), ...say('SAME TWO WEIGHTS', C.violet));
  await until(S(35)); await flow(...fbox(['4 × 1  = 4']));
  await until(S(36)); await play(...fbox(['4 × 1  = 4', '1 × −1 = −1']));
  await until(S(37)); await play(...N.value(1, 0, '3', C.amber), ...fbox(['4 × 1  = 4', '1 × −1 = −1', ['4 + (−1) = 3', C.amber]]));
  await until(S(38)); await play(new M.Flash(N.nodes[1][0], { color: C.amber }), ...say('POSITIVE: BRIGHT → DARK', C.amber));

  // window 3
  await until(S(39)); await play(new M.Transform(window, win(2)), ...say('ONE MORE PIXEL RIGHT  →', C.green), ...dropBox(), ...N.value(1, 0, ''));
  await until(S(40)); await play(...N.value(0, 0, '1', C.pink), ...N.value(0, 1, '1', C.pink), ...say('READINGS: 1 AND 1'));
  await until(S(41)); await flow(...fbox(['1 × 1  = 1']));
  await until(S(42)); await play(...fbox(['1 × 1  = 1', '1 × −1 = −1']));
  await until(S(43)); await play(...N.value(1, 0, '0', C.amber), ...fbox(['1 × 1  = 1', '1 × −1 = −1', ['1 + (−1) = 0', C.amber]]));
  await until(S(44)); await play(...fbox(['row 2 scores:', ['0   3   0', C.amber]], C.amber), ...say('SCORES: 0, 3, 0', C.amber));

  // 45-47 feature map
  await until(S(45)); await play(new M.FadeOut(new M.VGroup(N.group, wA, wB)), ...N.value(0, 0, ''), ...N.value(0, 1, ''), ...N.value(1, 0, ''), ...dropBox(), ...say('REPEAT FOR EVERY ROW'));
  for (const r of [0, 2, 3]) await play(new M.Transform(window, rect(bpos(r, 0)[0] - BS / 2, bpos(r, 0)[1] - BS / 2, bx1, bpos(r, 0)[1] + BS / 2, C.green, 6), { runTime: 0.6 }));
  const FC = P ? [0.2, -3.0, 0] : [0.1, -0.6, 0], FS = P ? 0.52 : 0.6;
  const fpos = (r, c) => [FC[0] + (c - 1) * FS, FC[1] + (1.5 - r) * FS, 0];
  const fm = [], fn = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const q = new M.Rectangle({ width: FS, height: FS, color: C.amber, strokeWidth: 2 });
    q.setFill(FM[r][c] ? C.amber : C.card, FM[r][c] ? 0.35 : 0.95); q.moveTo(fpos(r, c)); fm.push(q);
    const t = T(String(FM[r][c]), 18,FM[r][c] ? C.amber : C.muted, true); t.moveTo(fpos(r, c)); fn.push(t);
  }
  await until(S(46)); await play(new M.FadeOut(window), new M.LaggedStart(fm.map((q, i) => new M.FadeIn(new M.VGroup(q, fn[i]))), { lagRatio: 0.08, runTime: 2 }), ...say('A NEW GRID OF SCORES', C.amber));
  await until(S(47)); await play(...say('FEATURE MAP · SLIDING = CONVOLUTION', C.amber), ...(P ? [] : fbox([['feature map', C.amber], 'sliding filter', '= convolution'], C.amber)));
  await until(S(48)); await play(...say('ONE SHORT FORMULA'), ...dropBox());
  // feature map stays on screen on both layouts (phone: formula box sits below it)
  await until(S(49)); await play(...fbox(['score =', ['left reading', C.cyan], ['  × left weight', C.cyan], ['+ right reading', C.pink], ['  × right weight', C.pink]]));
  await until(S(50)); await play(new M.LaggedStart([4, 7].map(i => new M.Indicate(fm[i], { color: C.amber })), { lagRatio: 0.3, runTime: 1.4 }), ...say('IT FINDS EDGES ANYWHERE IN A PICTURE', C.green));
  await until(S(51)); await play(...say('WHAT IF DARK COMES FIRST?', C.amber));
  await until(S(52)); await play(...fbox(['readings 1, 4', '1×1 + 4×(−1)', ['= 1 − 4 = −3', C.pink]], C.pink));
  await until(S(53)); await play(...say('NEGATIVE: EDGE IN THE OTHER DIRECTION', C.pink));
  await until(S(54)); await play(...say('SAME WEIGHTS SLIDE ACROSS THE IMAGE', C.green), ...fbox(['filter [1, −1]', 'slides across', ['the whole image', C.green]], C.green));
}

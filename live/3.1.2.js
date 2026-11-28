// 3.1.2 Records in JSON: flattening a nested order (live manim-web lesson).
// Beat i = sentence i (0-based, 40 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const PILL = P ? [0, 3.85, 0] : [0, 1.98, 0];
  const BOXP_SIDE = P ? [0, -2.55, 0] : [4.25, -0.55, 0];
  const BOXP_BOT = P ? [0, -4.45, 0] : [0, -2.85, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  const monoCW = size => {
    const w20 = T('00000000000000000000', size, C.ink, true).getWidth();
    const w10 = T('0000000000', size, C.ink, true).getWidth();
    return Math.max(0.05, (w20 - w10) / 10);
  };

  // Single formula / summary box on screen at a time
  let boxNow = null;
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow;
    boxNow = null;
    return [new M.FadeOut(old)];
  }
  function fbox(lines, color = C.cyan, pos = BOXP_SIDE, maxw = P ? FW - 0.8 : 4.5) {
    const size = P ? 20 : 19, lh = P ? 0.42 : 0.38;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = monoCW(size);
    const widths = texts.map((t, i) => {
      const lead = rows[i][0].length - rows[i][0].trimStart().length;
      return t.getWidth() + cw * lead;
    });
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    r.moveTo(pos);
    const left = pos[0] - wd / 2 + 0.32, top = pos[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const lead = rows[i][0].length - rows[i][0].trimStart().length;
      t.moveTo([left + cw * lead + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // Helper: rectangular card with fill
  function card(x, y, w, h, color = C.cyan, fill = C.card, op = 0.94, sw = 2, r = 0.16) {
    const box = new M.RoundedRectangle({ width: w, height: h, cornerRadius: r, color, strokeWidth: sw });
    box.setFill(fill, op);
    box.moveTo([x, y, 0]);
    return box;
  }

  // Helper: pure outline highlight box
  function outline(x, y, w, h, color = C.amber, sw = 2.5, r = 0.12) {
    const box = new M.RoundedRectangle({ width: w, height: h, cornerRadius: r, color, strokeWidth: sw });
    box.moveTo([x, y, 0]);
    return box;
  }

  // =========================================================================
  // ACT 1 (0–1): Online bookstore sends each order as a small block of text
  // =========================================================================
  const a1Y = P ? 1.6 : 0.62, a1Dx = P ? 1.9 : 3.2;
  const shopBg = card(-a1Dx, a1Y, P ? 2.9 : 3.5, 1.35, C.amber);
  const awning = new M.Rectangle({ width: P ? 2.9 : 3.5, height: 0.24, color: C.amber, strokeWidth: 1.5 });
  awning.setFill(C.amber, 0.32); awning.moveTo([-a1Dx, a1Y + 0.55, 0]);
  const shopLbl = T('BOOKSTORE', P ? 17 : 20, C.amber, true, true); shopLbl.moveTo([-a1Dx, a1Y + 0.05, 0]);
  const shopSub = T('North · South', P ? 14 : 16, C.muted); shopSub.moveTo([-a1Dx, a1Y - 0.34, 0]);
  const shop = new M.VGroup(shopBg, awning, shopLbl, shopSub);

  const webBg = card(a1Dx, a1Y, P ? 2.9 : 3.5, 1.35, C.cyan);
  const webBar = new M.Line({ start: [a1Dx - (P ? 1.45 : 1.75), a1Y + 0.36, 0], end: [a1Dx + (P ? 1.45 : 1.75), a1Y + 0.36, 0], color: C.cyan, strokeWidth: 1.5 });
  const webDots = [0, 1, 2].map(k => {
    const d = new M.Dot({ point: [a1Dx - (P ? 1.15 : 1.4) + k * 0.22, a1Y + 0.52, 0], radius: 0.055, color: k === 0 ? C.pink : k === 1 ? C.amber : C.green });
    return d;
  });
  const webLbl = T('WEBSITE', P ? 17 : 20, C.cyan, true, true); webLbl.moveTo([a1Dx, a1Y - 0.02, 0]);
  const webSub = T('online orders', P ? 14 : 16, C.muted); webSub.moveTo([a1Dx, a1Y - 0.38, 0]);
  const web = new M.VGroup(webBg, webBar, ...webDots, webLbl, webSub);
  const linkShopWeb = new M.Arrow({ start: [-a1Dx + (P ? 1.52 : 1.85), a1Y, 0], end: [a1Dx - (P ? 1.52 : 1.85), a1Y, 0], color: C.muted, strokeWidth: 2 });

  // 0: Our bookstore also sells online.
  await until(S(0));
  await play(new M.FadeIn(shop), new M.Create(linkShopWeb), new M.FadeIn(web), ...say('OUR BOOKSTORE SELLS ONLINE'));

  // 1: The website sends each order to you as a small block of text.
  const blkY = P ? -1.45 : -1.62;
  const blkBg = card(0, blkY, P ? 3.8 : 4.2, 1.4, C.cyan);
  const blkLines = [0, 1, 2, 3].map(k => {
    const lw = [1.5, 2.4, 2.9, 2.2][k];
    const ln = new M.Line({ start: [-1.45, blkY + 0.35 - k * 0.24, 0], end: [-1.45 + lw, blkY + 0.35 - k * 0.24, 0], color: k === 0 ? C.amber : C.cyan, strokeWidth: 4 });
    return ln;
  });
  const blkLbl = T('small block of text', P ? 15 : 16, C.muted, true); blkLbl.moveTo([0, blkY - 0.92, 0]);
  const smallBlock = new M.VGroup(blkBg, ...blkLines, blkLbl);
  const sendArrow = new M.Arrow({ start: [a1Dx * 0.55, a1Y - 0.75, 0], end: [0.3, blkY + 0.78, 0], color: C.amber, strokeWidth: 2.5 });

  await until(S(1));
  await play(new M.Create(sendArrow), new M.FadeIn(smallBlock, { shift: [0, -0.2, 0] }), ...say('EACH ORDER = A BLOCK OF TEXT', C.amber));

  // =========================================================================
  // ACT 2 (2–11): Exploring the JSON text block of order 103
  // =========================================================================
  const JX = P ? 0 : -2.35, JY = P ? 1.35 : -0.55;
  const maxJCardW = P ? 7.35 : 7.05;
  const maxCols = 42;
  let jSize = P ? 17 : 18;
  let jcw = monoCW(jSize);
  if (maxCols * jcw + 0.65 > maxJCardW) {
    jSize = Math.max(12, Math.floor(jSize * (maxJCardW - 0.65) / (maxCols * jcw)));
    jcw = monoCW(jSize);
  }
  const jCardW = Math.min(maxJCardW, maxCols * jcw + 0.65);
  const jLineH = P ? 0.38 : 0.38;
  const jCardH = 8 * jLineH + 0.5;
  const jLeft = JX - jCardW / 2 + 0.32;
  const jTop = JY + jCardH / 2 - 0.34;
  const jRowY = row => jTop - row * jLineH;

  function monoTokens(row, parts) {
    const y = jRowY(row);
    let col = 0;
    const objs = [];
    for (const [str, color] of parts) {
      const t = T(str, jSize, color, true);
      t.moveTo([jLeft + (col + str.length / 2) * jcw, y, 0]);
      objs.push(t);
      col += str.length;
    }
    return new M.VGroup(...objs);
  }
  const spanBox = (row, cStart, cLen, color) =>
    outline(jLeft + (cStart + cLen / 2) * jcw, jRowY(row), cLen * jcw + 0.14, jLineH * 0.92, color, 2.5, 0.08);

  const jCard = card(JX, JY, jCardW, jCardH, C.cyan);
  const jOpen = monoTokens(0, [['{', C.amber]]);
  const jClose = monoTokens(7, [['}', C.amber]]);
  const jOrder = monoTokens(1, [['  ', C.ink], ['"order"', C.ink], [': ', C.muted], ['103', C.cyan], [',', C.muted]]);
  const jStore = monoTokens(2, [['  ', C.ink], ['"store"', C.ink], [': ', C.muted], ['"North"', C.cyan], [',', C.muted]]);
  const jItemsOpen = monoTokens(3, [['  ', C.ink], ['"items"', C.ink], [': ', C.muted], ['[', C.green]]);
  const jItem1 = monoTokens(4, [
    ['    {', C.muted], ['"book"', C.ink], [':', C.muted], ['"B2"', C.amber], [', ', C.muted],
    ['"copies"', C.ink], [':', C.muted], ['1', C.amber], [', ', C.muted],
    ['"price"', C.ink], [':', C.muted], ['20', C.amber], ['},', C.muted]
  ]);
  const jItem2 = monoTokens(5, [
    ['    {', C.muted], ['"book"', C.ink], [':', C.muted], ['"B3"', C.violet], [', ', C.muted],
    ['"copies"', C.ink], [':', C.muted], ['2', C.violet], [', ', C.muted],
    ['"price"', C.ink], [':', C.muted], ['15', C.violet], ['}', C.muted]
  ]);
  const jItemsClose = monoTokens(6, [['  ', C.ink], [']', C.green]]);

  // 2: Let's look at one of these blocks: order one oh three.
  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(shop, web, linkShopWeb, sendArrow, smallBlock)),
    new M.FadeIn(jCard), new M.FadeIn(jOpen), new M.FadeIn(jClose),
    ...say('ORDER 103')
  );

  // 3: At the top, it says: order, one oh three. Store, North.
  await until(S(3));
  await play(
    new M.FadeIn(jOrder), new M.FadeIn(jStore),
    ...fbox([['top of the order', C.muted], ['order = 103', C.cyan], ['store = North', C.cyan]], C.cyan),
    ...say('TOP: ORDER 103 · STORE NORTH')
  );

  // 4: Then it says: items. And under items, there is a list.
  await until(S(4));
  await play(
    new M.FadeIn(jItemsOpen), new M.FadeIn(jItemsClose),
    ...fbox([['items = [ ... ]', C.green], 'a list inside the order'], C.green),
    ...say('ITEMS: A LIST', C.green)
  );

  // 5: The first item: book B two, one copy, price twenty.
  await until(S(5));
  await play(
    new M.FadeIn(jItem1),
    ...fbox([['item 1', C.amber], 'book   = B2', 'copies = 1', 'price  = 20'], C.amber),
    ...say('ITEM 1: B2 · 1 COPY · $20', C.amber)
  );

  // 6: The second item: book B three, two copies, price fifteen.
  await until(S(6));
  await play(
    new M.FadeIn(jItem2),
    ...fbox([['item 2', C.violet], 'book   = B3', 'copies = 2', 'price  = 15'], C.violet),
    ...say('ITEM 2: B3 · 2 COPIES · $15', C.violet)
  );

  // 7: Each part has a name and a value. In "store: North", the name is store and the value is North.
  const boxName = spanBox(2, 2, 7, C.amber);
  const boxVal = spanBox(2, 11, 7, C.cyan);
  await until(S(7));
  await play(
    new M.Create(boxName), new M.Create(boxVal),
    ...fbox(['"store": "North"', ['name  = store', C.amber], ['value = North', C.cyan]], C.amber),
    ...say('EACH PART = NAME : VALUE', C.amber)
  );

  // 8: Curly brackets wrap the whole order. Square brackets wrap the list of items.
  const hiCurly1 = spanBox(0, 0, 1, C.amber);
  const hiCurly2 = spanBox(7, 0, 1, C.amber);
  const hiSq1 = spanBox(3, 11, 1, C.green);
  const hiSq2 = spanBox(6, 2, 1, C.green);
  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(boxName, boxVal)),
    new M.Create(hiCurly1), new M.Create(hiCurly2),
    new M.Create(hiSq1), new M.Create(hiSq2),
    ...fbox([['{  }  whole order', C.amber], ['[  ]  list of items', C.green]], C.cyan),
    ...say('{ } = ORDER    [ ] = LIST')
  );

  // 9: This way of writing records is called JSON. You say it like the name Jason.
  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(hiCurly1, hiCurly2, hiSq1, hiSq2)),
    new M.Indicate(jCard, { color: C.cyan }),
    ...fbox([['JSON', C.cyan], ['said like "Jason"', C.muted]], C.cyan),
    ...say('CALLED JSON ("JASON")')
  );

  // 10: It is one of the most common ways for websites to send data.
  await until(S(10));
  await play(
    ...fbox([['JSON', C.cyan], 'websites → data', 'most common format'], C.cyan),
    ...say('HOW WEBSITES SEND DATA')
  );

  // 11: A record is everything we know about one thing, here one order.
  const recFrame = outline(JX, JY, jCardW + 0.16, jCardH + 0.16, C.cyan, 3, 0.2);
  await until(S(11));
  await play(
    new M.Create(recFrame),
    ...fbox([['1 record', C.cyan], '= everything about', '  one order (103)'], C.cyan),
    ...say('1 RECORD = 1 WHOLE ORDER')
  );

  // =========================================================================
  // ACT 3 (12–17): Nested shape, shopping bag analogy, vs flat sales table
  // =========================================================================
  const NX = P ? 0 : 4.15, NY = P ? -2.55 : -0.55;
  const nW = P ? 6.5 : 4.45, nH = P ? 3.1 : 3.25;
  const nestOuter = card(NX, NY, nW, nH, C.cyan, C.card, 0.92, 2.2, 0.18);
  const nestOuterLbl = T('Order 103 (North)', P ? 16 : 16, C.cyan, true, true);
  nestOuterLbl.moveTo([NX, NY + nH / 2 - 0.3, 0]);
  const nOuterG = new M.VGroup(nestOuter, nestOuterLbl);

  const nestMid = card(NX, NY - 0.24, nW - 0.55, nH - 0.95, C.green, C.bg, 0.85, 2, 0.14);
  const nestMidLbl = T('items list', P ? 15 : 15, C.green, true, true);
  nestMidLbl.moveTo([NX, NY - 0.24 + (nH - 0.95) / 2 - 0.26, 0]);
  const nMidG = new M.VGroup(nestMid, nestMidLbl);

  const ni1 = card(NX, NY - 0.12, nW - 1.1, 0.62, C.amber, C.card, 0.95, 1.8, 0.1);
  const ni1T = T('B2 · 1 copy · $20', P ? 15 : 15, C.amber, true); ni1T.moveTo([NX, NY - 0.12, 0]);
  const nItem1G = new M.VGroup(ni1, ni1T);

  const ni2 = card(NX, NY - 0.86, nW - 1.1, 0.62, C.violet, C.card, 0.95, 1.8, 0.1);
  const ni2T = T('B3 · 2 copies · $15', P ? 15 : 15, C.violet, true); ni2T.moveTo([NX, NY - 0.86, 0]);
  const nItem2G = new M.VGroup(ni2, ni2T);

  // 12: Notice the shape. One order holds a list, and the list holds two items.
  await until(S(12));
  await play(
    new M.FadeOut(recFrame), ...clearBox(),
    new M.LaggedStart([new M.FadeIn(nOuterG), new M.FadeIn(nMidG), new M.FadeIn(nItem1G), new M.FadeIn(nItem2G)], { lagRatio: 0.25, runTime: 1.8 }),
    ...say('ORDER → LIST → 2 ITEMS')
  );

  // 13: Something sitting inside something else is called nested.
  await until(S(13));
  await play(
    new M.Indicate(nMidG, { color: C.violet }),
    ...say('INSIDE ANOTHER = NESTED', C.violet)
  );

  // 14: It is like a shopping bag that holds two books.
  const BX = P ? 0 : -3.55, BY = P ? 1.35 : -0.62;
  const bw = P ? 5.2 : 4.2, bh = P ? 2.25 : 2.45;
  const bagHandle = new M.Arc({ radius: 0.55, startAngle: 0, angle: Math.PI, color: C.cyan, strokeWidth: 3.5 });
  bagHandle.moveTo([BX, BY + bh / 2 + 0.26, 0]);
  const bagBody = card(BX, BY, bw, bh, C.cyan, C.card, 0.94, 2.5, 0.2);
  const bagTag = T('Order 103 · North', P ? 16 : 16, C.cyan, true, true);
  bagTag.moveTo([BX, BY + bh / 2 - 0.34, 0]);
  const bk1 = card(BX, BY + 0.08, bw - 0.7, 0.62, C.amber, C.bg, 0.92, 2, 0.1);
  const bk1T = T('Book B2 · 1 · $20', P ? 15 : 15, C.amber, true); bk1T.moveTo([BX, BY + 0.08, 0]);
  const bk2 = card(BX, BY - 0.66, bw - 0.7, 0.62, C.violet, C.bg, 0.92, 2, 0.1);
  const bk2T = T('Book B3 · 2 · $15', P ? 15 : 15, C.violet, true); bk2T.moveTo([BX, BY - 0.66, 0]);
  const bagCaption = T('nested (website)', P ? 14 : 15, C.muted, true);
  bagCaption.moveTo([BX, BY - bh / 2 - 0.28, 0]);
  const bagPic = new M.VGroup(bagHandle, bagBody, bagTag, bk1, bk1T, bk2, bk2T, bagCaption);

  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(jCard, jOpen, jClose, jOrder, jStore, jItemsOpen, jItem1, jItem2, jItemsClose, nOuterG, nMidG, nItem1G, nItem2G)),
    new M.FadeIn(bagPic),
    ...say('LIKE A BAG HOLDING TWO BOOKS', C.amber)
  );

  // 15: This shape is natural for the website. But our sales table, from the last lesson, is flat.
  const MX = P ? 0 : 2.35, MY = P ? -2.35 : -0.58;
  const mCols = P ? [1.65, 1.65, 1.85, 1.85] : [1.45, 1.45, 1.6, 1.6];
  const mW = mCols.reduce((a, b) => a + b, 0);
  const mRH = 0.5;
  const mColX = c => {
    let x = MX - mW / 2;
    for (let k = 0; k < c; k++) x += mCols[k];
    return x + mCols[c] / 2;
  };
  const mRowY = r => MY + 0.75 - r * mRH;
  const miniParts = [];
  const mHdrs = ['Order', 'Book', 'Copies', 'Price'];
  const mData = [
    ['101', 'B1', '2', '10', C.cyan],
    ['101', 'B2', '1', '20', C.cyan],
    ['102', 'B3', '1', '15', C.pink]
  ];
  // grid frame + cells
  miniParts.push(card(MX, MY, mW, 4 * mRH, C.muted, C.card, 0.92, 1.8, 0.1));
  const mHdrBar = new M.Rectangle({ width: mW, height: mRH, color: C.line, strokeWidth: 1 });
  mHdrBar.setFill(C.line, 0.55); mHdrBar.moveTo([MX, mRowY(0), 0]);
  miniParts.push(mHdrBar);
  for (let r = 1; r < 4; r++) {
    const y = mRowY(r) + mRH / 2;
    miniParts.push(new M.Line({ start: [MX - mW / 2, y, 0], end: [MX + mW / 2, y, 0], color: C.line, strokeWidth: 1.4 }));
  }
  let mxAcc = MX - mW / 2;
  for (let c = 0; c < 3; c++) {
    mxAcc += mCols[c];
    miniParts.push(new M.Line({ start: [mxAcc, MY + 2 * mRH, 0], end: [mxAcc, MY - 2 * mRH, 0], color: C.line, strokeWidth: 1.4 }));
  }
  mHdrs.forEach((h, c) => {
    const t = T(h, P ? 14 : 15, C.muted, true, true); t.moveTo([mColX(c), mRowY(0), 0]);
    miniParts.push(t);
  });
  mData.forEach((row, r) => {
    for (let c = 0; c < 4; c++) {
      const t = T(row[c], P ? 15 : 16, row[4], true); t.moveTo([mColX(c), mRowY(r + 1), 0]);
      miniParts.push(t);
    }
  });
  const miniCap = T('flat sales table', P ? 14 : 15, C.muted, true);
  miniCap.moveTo([MX, MY - 2 * mRH - 0.3, 0]);
  miniParts.push(miniCap);
  const miniTable = new M.VGroup(...miniParts);

  await until(S(15));
  await play(new M.FadeIn(miniTable), ...say('OUR SALES TABLE IS FLAT'));

  // 16: Flat means rows and columns only, with one value in each cell.
  const oneCellHi = outline(mColX(1), mRowY(1), mCols[1] - 0.08, mRH - 0.08, C.amber, 2.8, 0.06);
  const oneCellDot = new M.Dot({ point: [mColX(1), mRowY(1), 0], radius: 0.01, color: C.amber });
  oneCellDot.setFill(C.amber, 0);
  await until(S(16));
  await play(new M.Create(oneCellHi), new M.Flash(oneCellDot, { color: C.amber, flashRadius: 0.25 }), ...say('FLAT = 1 VALUE PER CELL', C.amber));

  // 17: A cell cannot hold a whole list. So how do we fit this order in?
  const badBg = card(mColX(1), mRowY(2), mCols[1] + 0.5, mRH + 0.12, C.pink, C.bg, 0.96, 2.5, 0.08);
  const badTxt = T('[B2, B3] ✕', P ? 14 : 14, C.pink, true, true); badTxt.moveTo([mColX(1), mRowY(2), 0]);
  const badCell = new M.VGroup(badBg, badTxt);
  await until(S(17));
  await play(new M.FadeOut(oneCellHi), new M.FadeIn(badCell), ...say('A CELL CANNOT HOLD A LIST', C.pink));

  // =========================================================================
  // ACT 4 (18–28): Flattening step by step — unpacking into the 6-col table
  // =========================================================================
  // Top compact bag bar
  const BY2 = P ? 1.6 : 0.72;
  const bag2W = P ? 7.2 : 10.6, bag2H = P ? 1.85 : 0.86;
  const bag2Handle = new M.Arc({ radius: P ? 0.38 : 0.3, startAngle: 0, angle: Math.PI, color: C.cyan, strokeWidth: 3 });
  bag2Handle.moveTo([0, BY2 + bag2H / 2 + (P ? 0.2 : 0.16), 0]);
  const bag2Box = card(0, BY2, bag2W, bag2H, C.cyan, C.card, 0.92, 2, 0.18);

  const tagPos = P ? [0, BY2 + 0.56, 0] : [-3.35, BY2, 0];
  const tagW = P ? 4.8 : 3.45, tagH = P ? 0.46 : 0.54;
  const bag2TagBox = card(tagPos[0], tagPos[1], tagW, tagH, C.cyan, C.bg, 0.92, 1.8, 0.1);
  const bag2TagTxt = T('order: 103 · store: North', 15, C.cyan, true, true);
  bag2TagTxt.moveTo(tagPos);
  const bag2Tag = new M.VGroup(bag2TagBox, bag2TagTxt);

  const b1Pos = P ? [-1.75, BY2 - 0.34, 0] : [0.35, BY2, 0];
  const b2Pos = P ? [1.75, BY2 - 0.34, 0] : [3.45, BY2, 0];
  const chipW = P ? 3.15 : 2.85, chipH = P ? 0.62 : 0.54;
  const chip1 = new M.VGroup(
    card(b1Pos[0], b1Pos[1], chipW, chipH, C.amber, C.bg, 0.92, 1.8, 0.1),
    T('B2 · 1 copy · $20', P ? 15 : 14, C.amber, true).moveTo(b1Pos)
  );
  const chip2 = new M.VGroup(
    card(b2Pos[0], b2Pos[1], chipW, chipH, C.violet, C.bg, 0.92, 1.8, 0.1),
    T('B3 · 2 copies · $15', P ? 15 : 14, C.violet, true).moveTo(b2Pos)
  );
  const bag2Base = new M.VGroup(bag2Handle, bag2Box);

  // 6-column flat table: Order | Store | Line | Book | Copies | Price
  const tCols = P ? [1.15, 1.35, 1.0, 1.1, 1.4, 1.4] : [1.8, 1.8, 1.6, 1.8, 1.9, 1.9];
  const tW = tCols.reduce((a, b) => a + b, 0);
  const tHdrY = P ? -0.95 : -0.3;
  const tHdrH = P ? 0.55 : 0.5;
  const tRowH = P ? 0.72 : 0.62;
  const tR1Y = P ? -1.6 : -0.87;
  const tR2Y = P ? -2.35 : -1.5;
  const tColX = c => {
    let x = -tW / 2;
    for (let k = 0; k < c; k++) x += tCols[k];
    return x + tCols[c] / 2;
  };
  const tTopY = tHdrY + tHdrH / 2;
  const tBotY = tR2Y - tRowH / 2;
  const tTotH = tTopY - tBotY;
  const tMidY = (tTopY + tBotY) / 2;

  const tGridParts = [];
  tGridParts.push(card(0, tMidY, tW, tTotH, C.muted, C.card, 0.92, 2, 0.12));
  const tHdrFill = new M.Rectangle({ width: tW, height: tHdrH, color: C.line, strokeWidth: 1 });
  tHdrFill.setFill(C.line, 0.6); tHdrFill.moveTo([0, tHdrY, 0]);
  tGridParts.push(tHdrFill);
  const ySep1 = (tHdrY - tHdrH / 2 + tR1Y + tRowH / 2) / 2;
  const ySep2 = (tR1Y - tRowH / 2 + tR2Y + tRowH / 2) / 2;
  tGridParts.push(new M.Line({ start: [-tW / 2, ySep1, 0], end: [tW / 2, ySep1, 0], color: C.line, strokeWidth: 1.6 }));
  tGridParts.push(new M.Line({ start: [-tW / 2, ySep2, 0], end: [tW / 2, ySep2, 0], color: C.line, strokeWidth: 1.6 }));
  let txAcc = -tW / 2;
  for (let c = 0; c < 5; c++) {
    txAcc += tCols[c];
    tGridParts.push(new M.Line({ start: [txAcc, tTopY, 0], end: [txAcc, tBotY, 0], color: C.line, strokeWidth: 1.4 }));
  }
  const tHdrNames = ['Order', 'Store', 'Line', 'Book', 'Copies', 'Price'];
  const tHdrTexts = tHdrNames.map((h, c) => {
    const t = T(h, P ? 15 : 16, C.muted, true, true); t.moveTo([tColX(c), tHdrY, 0]);
    return t;
  });
  const tGrid = new M.VGroup(...tGridParts, ...tHdrTexts);

  // 18: The idea: give each item its own row.
  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(bagPic, miniTable, badCell)),
    new M.FadeIn(bag2Base), new M.FadeIn(bag2Tag), new M.FadeIn(chip1), new M.FadeIn(chip2),
    new M.FadeIn(tGrid),
    ...say('IDEA: ONE ROW PER ITEM', C.green)
  );

  // 19: Let's take the books out of the bag, and put each one on its own line.
  const unpackA1 = new M.Arrow({ start: [b1Pos[0], BY2 - bag2H / 2 - 0.04, 0], end: [tColX(3), tTopY + 0.04, 0], color: C.amber, strokeWidth: 2.5 });
  const unpackA2 = new M.Arrow({ start: [b2Pos[0], BY2 - bag2H / 2 - 0.04, 0], end: [tColX(5), tTopY + 0.04, 0], color: C.violet, strokeWidth: 2.5 });
  await until(S(19));
  await play(
    new M.Create(unpackA1), new M.Create(unpackA2),
    ...say('UNPACK EACH BOOK TO ITS OWN ROW', C.amber)
  );

  // Cell factory
  const cellSize = P ? 17 : 19;
  const makeCell = (rowY, col, text, color) => {
    const t = T(text, cellSize, color, true, true);
    t.moveTo([tColX(col), rowY, 0]);
    return t;
  };

  // 20: Row one: book B two, one copy, price twenty.
  const r1Book = makeCell(tR1Y, 3, 'B2', C.amber);
  const r1Cpy = makeCell(tR1Y, 4, '1', C.amber);
  const r1Prc = makeCell(tR1Y, 5, '20', C.amber);
  await until(S(20));
  await play(
    new M.LaggedStart([r1Book, r1Cpy, r1Prc].map(c => new M.FadeIn(c, { shift: [0, -0.25, 0] })), { lagRatio: 0.2, runTime: 1.1 }),
    ...say('ROW 1: B2 · 1 COPY · $20', C.amber)
  );

  // 21: Row two: book B three, two copies, price fifteen.
  const r2Book = makeCell(tR2Y, 3, 'B3', C.violet);
  const r2Cpy = makeCell(tR2Y, 4, '2', C.violet);
  const r2Prc = makeCell(tR2Y, 5, '15', C.violet);
  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(unpackA1, unpackA2)),
    new M.LaggedStart([r2Book, r2Cpy, r2Prc].map(c => new M.FadeIn(c, { shift: [0, -0.25, 0] })), { lagRatio: 0.2, runTime: 1.1 }),
    ...say('ROW 2: B3 · 2 COPIES · $15', C.violet)
  );

  // 22: But wait. Which order did each book come from? Which shop?
  const qMarks = [
    makeCell(tR1Y, 0, '?', C.pink), makeCell(tR1Y, 1, '?', C.pink),
    makeCell(tR2Y, 0, '?', C.pink), makeCell(tR2Y, 1, '?', C.pink)
  ];
  await until(S(22));
  await play(
    new M.LaggedStart(qMarks.map(q => new M.FadeIn(q)), { lagRatio: 0.15, runTime: 0.9 }),
    ...say('WHICH ORDER? WHICH SHOP?', C.pink)
  );

  // 23: The bag told us that once, at the top. Now each row must say it again.
  const tagHi = outline(tagPos[0], tagPos[1], tagW + 0.14, tagH + 0.14, C.amber, 2.8, 0.12);
  await until(S(23));
  await play(
    new M.Create(tagHi),
    new M.Indicate(bag2Tag, { color: C.amber }),
    ...say('ON THE BAG ONCE → REPEAT ON EVERY ROW', C.cyan)
  );

  // 24: So we copy the order fields onto every row.
  const r1Ord = makeCell(tR1Y, 0, '103', C.cyan);
  const r1Str = makeCell(tR1Y, 1, 'North', C.cyan);
  const r2Ord = makeCell(tR2Y, 0, '103', C.cyan);
  const r2Str = makeCell(tR2Y, 1, 'North', C.cyan);
  await until(S(24));
  await play(
    new M.FadeOut(new M.VGroup(...qMarks, tagHi)),
    new M.LaggedStart([r1Ord, r1Str, r2Ord, r2Str].map(c => new M.FadeIn(c, { shift: [0, -0.3, 0] })), { lagRatio: 0.15, runTime: 1.2 }),
    ...say('COPY ORDER & STORE TO EVERY ROW')
  );

  // 25: The JSON has no line numbers, so we add them: line one and line two, in the order the items appear.
  const r1Ln = makeCell(tR1Y, 2, '1', C.green);
  const r2Ln = makeCell(tR2Y, 2, '2', C.green);
  const lnColHi = outline(tColX(2), tMidY, tCols[2] - 0.06, tTotH - 0.06, C.green, 2.5, 0.08);
  await until(S(25));
  await play(
    new M.Create(lnColHi),
    new M.LaggedStart([new M.FadeIn(r1Ln), new M.FadeIn(r2Ln)], { lagRatio: 0.35, runTime: 1.3 }),
    ...say('ADD LINE NUMBERS: 1 AND 2', C.green)
  );

  // 26: Row one becomes: order one oh three, store North, line one, book B two, one copy, twenty dollars.
  const r1Cells = [r1Ord, r1Str, r1Ln, r1Book, r1Cpy, r1Prc];
  const row1Hi = outline(0, tR1Y, tW - 0.06, tRowH - 0.04, C.cyan, 2.8, 0.08);
  await until(S(26));
  await play(
    new M.FadeOut(lnColHi),
    new M.Create(row1Hi),
    new M.LaggedStart(r1Cells.map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.28, runTime: 3.6 }),
    ...say('ROW 1: 103 · NORTH · 1 · B2 · 1 · $20')
  );

  // 27: Row two becomes: order one oh three, store North, line two, book B three, two copies, fifteen dollars.
  const r2Cells = [r2Ord, r2Str, r2Ln, r2Book, r2Cpy, r2Prc];
  const row2Hi = outline(0, tR2Y, tW - 0.06, tRowH - 0.04, C.cyan, 2.8, 0.08);
  await until(S(27));
  await play(
    new M.FadeOut(row1Hi),
    new M.Create(row2Hi),
    new M.LaggedStart(r2Cells.map(c => new M.Indicate(c, { color: C.violet })), { lagRatio: 0.28, runTime: 3.6 }),
    ...say('ROW 2: 103 · NORTH · 2 · B3 · 2 · $15')
  );

  // 28: This is called flattening: one nested record becomes several flat rows.
  await until(S(28));
  await play(
    new M.FadeOut(row2Hi),
    ...fbox([['FLATTENING', C.green], '1 nested record  →  2 flat rows'], C.green, BOXP_BOT, P ? 7.2 : 9.6),
    ...say('FLATTENING: 1 RECORD → FLAT ROWS', C.green)
  );

  // =========================================================================
  // ACT 5 (29–34): Check that nothing was lost & what flattening is for
  // =========================================================================
  // 29: Let's check that nothing was lost.
  await until(S(29));
  await play(
    ...fbox([['CHECK TOTAL', C.amber], 'row 1 + row 2 = ?'], C.amber, BOXP_BOT, P ? 7.2 : 9.6),
    ...say('CHECK: NOTHING WAS LOST', C.amber)
  );

  // 30: Row one is worth one times twenty: twenty dollars.
  const calcX = (tColX(4) + tColX(5)) / 2;
  const calcW = tCols[4] + tCols[5] - 0.06;
  const r1CalcHi = outline(calcX, tR1Y, calcW, tRowH - 0.06, C.amber, 2.6, 0.08);
  await until(S(30));
  await play(
    new M.Create(r1CalcHi),
    ...fbox([['row 1:  1 × $20 = $20', C.amber]], C.amber, BOXP_BOT, P ? 7.2 : 9.6),
    ...say('ROW 1: 1 × $20 = $20', C.amber)
  );

  // 31: Row two is worth two times fifteen: thirty dollars.
  const r2CalcHi = outline(calcX, tR2Y, calcW, tRowH - 0.06, C.violet, 2.6, 0.08);
  await until(S(31));
  await play(
    new M.FadeOut(r1CalcHi),
    new M.Create(r2CalcHi),
    ...fbox([['row 1:  1 × $20 = $20', C.muted], ['row 2:  2 × $15 = $30', C.violet]], C.violet, BOXP_BOT, P ? 7.2 : 9.6),
    ...say('ROW 2: 2 × $15 = $30', C.violet)
  );

  // 32: Twenty plus thirty is fifty. That is the full value of order one oh three.
  await until(S(32));
  await play(
    new M.FadeOut(r2CalcHi),
    new M.Indicate(bag2Tag, { color: C.green }),
    ...fbox([['row 1:  $20   ·   row 2:  $30', C.ink], ['total:  $20 + $30 = $50  ✓', C.green]], C.green, BOXP_BOT, P ? 7.2 : 9.6),
    ...say('FULL VALUE OF ORDER 103 = $50', C.green)
  );

  // 33: In short: one row for each item, plus the order fields copied onto every row.
  const repX = (tColX(0) + tColX(1)) / 2;
  const repW = tCols[0] + tCols[1] - 0.06;
  const repHi = outline(repX, (tR1Y + tR2Y) / 2, repW, (tR1Y - tR2Y) + tRowH - 0.06, C.cyan, 2.6, 0.08);
  const itmX = (tColX(3) + tColX(5)) / 2;
  const itmW = tCols[3] + tCols[4] + tCols[5] - 0.06;
  const itmHi = outline(itmX, (tR1Y + tR2Y) / 2, itmW, (tR1Y - tR2Y) + tRowH - 0.06, C.amber, 2.6, 0.08);
  await until(S(33));
  await play(
    new M.Create(itmHi), new M.Create(repHi),
    ...fbox([['1 row per item', C.amber], ['+ order fields copied onto every row', C.cyan]], C.cyan, BOXP_BOT, P ? 7.2 : 9.6),
    ...say('1 ROW PER ITEM + COPIED FIELDS')
  );

  // 34: This is what flattening is for. Most tables and charts need flat rows, and most websites send nested records.
  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(repHi, itmHi)),
    ...fbox([['websites        →  nested JSON', C.violet], ['tables & charts →  flat rows', C.green]], C.green, BOXP_BOT, P ? 7.2 : 9.6),
    ...say('NESTED JSON  →  FLAT TABLES & CHARTS', C.green)
  );

  // =========================================================================
  // ACT 6 (35–39): Common trap, next lesson preview, one-sentence recap
  // =========================================================================
  // 35: Here is a common trap. After flattening, order one oh three appears twice.
  const trapHi = outline(tColX(0), (tR1Y + tR2Y) / 2, tCols[0] - 0.08, (tR1Y - tR2Y) + tRowH - 0.06, C.pink, 3, 0.08);
  await until(S(35));
  await play(
    new M.Create(trapHi),
    ...fbox([['COMMON TRAP', C.pink], 'order 103 now appears in 2 rows'], C.pink, BOXP_BOT, P ? 7.2 : 9.6),
    ...say('TRAP: ORDER 103 APPEARS TWICE', C.pink)
  );

  // 36: If you now count rows, you will think there were two orders. There was only one.
  await until(S(36));
  await play(
    new M.Indicate(trapHi, { color: C.pink }),
    ...fbox([['2 rows  ≠  2 orders', C.pink], ['there was only 1 order (103)', C.amber]], C.pink, BOXP_BOT, P ? 7.2 : 9.6),
    ...say('2 ROWS ≠ 2 ORDERS (ONLY 1!)', C.pink)
  );

  // 37: Rows now mean items, not orders. We will look at this carefully in a later lesson.
  const rowsHi = outline(0, (tR1Y + tR2Y) / 2, tW - 0.06, (tR1Y - tR2Y) + tRowH - 0.04, C.green, 2.6, 0.08);
  await until(S(37));
  await play(
    new M.FadeOut(trapHi),
    new M.Create(rowsHi),
    ...fbox([['1 row = 1 item (not 1 order)', C.green], ['we revisit this in a later lesson', C.muted]], C.green, BOXP_BOT, P ? 7.2 : 9.6),
    ...say('ROWS = ITEMS, NOT ORDERS', C.green)
  );

  // 38: Next, we will see how the website sends many orders, a few at a time.
  const p1Pos = P ? [0, 1.35, 0] : [-3.1, -0.45, 0];
  const p2Pos = P ? [0, -2.15, 0] : [3.1, -0.45, 0];
  const pgW = P ? 5.6 : 4.2, pgH = P ? 2.15 : 2.35;
  const page1 = new M.VGroup(
    card(p1Pos[0], p1Pos[1], pgW, pgH, C.cyan, C.card, 0.94, 2, 0.16),
    T('PAGE 1', P ? 16 : 17, C.cyan, true, true).moveTo([p1Pos[0], p1Pos[1] + 0.72, 0]),
    T('order 101  (North)', P ? 15 : 16, C.ink, true).moveTo([p1Pos[0], p1Pos[1] + 0.18, 0]),
    T('order 102  (South)', P ? 15 : 16, C.pink, true).moveTo([p1Pos[0], p1Pos[1] - 0.28, 0]),
    T('next page: 2', P ? 14 : 15, C.amber, true).moveTo([p1Pos[0], p1Pos[1] - 0.78, 0])
  );
  const page2 = new M.VGroup(
    card(p2Pos[0], p2Pos[1], pgW, pgH, C.violet, C.card, 0.94, 2, 0.16),
    T('PAGE 2', P ? 16 : 17, C.violet, true, true).moveTo([p2Pos[0], p2Pos[1] + 0.72, 0]),
    T('order 103  (North)', P ? 15 : 16, C.cyan, true).moveTo([p2Pos[0], p2Pos[1] + 0.18, 0]),
    T('order 104  (South)', P ? 15 : 16, C.pink, true).moveTo([p2Pos[0], p2Pos[1] - 0.28, 0]),
    T('no next page', P ? 14 : 15, C.muted, true).moveTo([p2Pos[0], p2Pos[1] - 0.78, 0])
  );
  const pgArrow = P
    ? new M.Arrow({ start: [0, p1Pos[1] - pgH / 2 - 0.1, 0], end: [0, p2Pos[1] + pgH / 2 + 0.1, 0], color: C.amber, strokeWidth: 3 })
    : new M.Arrow({ start: [p1Pos[0] + pgW / 2 + 0.15, p1Pos[1], 0], end: [p2Pos[0] - pgW / 2 - 0.15, p2Pos[1], 0], color: C.amber, strokeWidth: 3 });

  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(bag2Base, bag2Tag, chip1, chip2, tGrid, ...r1Cells, ...r2Cells, rowsHi)),
    ...clearBox(),
    new M.FadeIn(page1), new M.Create(pgArrow), new M.FadeIn(page2),
    ...say('NEXT: MANY ORDERS, PAGE BY PAGE', C.violet)
  );

  // 39: In one sentence: flattening turns one nested record into one flat row per item, with the shared fields repeated.
  const rnPos = P ? [0, 1.95, 0] : [-3.55, 0.35, 0];
  const rfPos = P ? [0, -0.35, 0] : [2.55, 0.35, 0];
  const rNest = new M.VGroup(
    card(rnPos[0], rnPos[1], P ? 5.6 : 4.3, P ? 1.55 : 1.75, C.violet, C.card, 0.94, 2, 0.16),
    T('1 NESTED RECORD', P ? 14 : 15, C.violet, true, true).moveTo([rnPos[0], rnPos[1] + 0.48, 0]),
    T('103 · North', P ? 15 : 16, C.cyan, true).moveTo([rnPos[0], rnPos[1] + 0.02, 0]),
    T('[ B2 (1,$20), B3 (2,$15) ]', P ? 13 : 14, C.amber, true).moveTo([rnPos[0], rnPos[1] - 0.44, 0])
  );
  const rFlat = new M.VGroup(
    card(rfPos[0], rfPos[1], P ? 6.8 : 6.0, P ? 1.55 : 1.75, C.green, C.card, 0.94, 2, 0.16),
    T('FLAT ROWS (1 PER ITEM)', P ? 14 : 15, C.green, true, true).moveTo([rfPos[0], rfPos[1] + 0.48, 0]),
    T('103 | North | 1 | B2 | 1 | 20', P ? 13 : 15, C.cyan, true).moveTo([rfPos[0], rfPos[1] + 0.02, 0]),
    T('103 | North | 2 | B3 | 2 | 15', P ? 13 : 15, C.cyan, true).moveTo([rfPos[0], rfPos[1] - 0.44, 0])
  );
  const rArrow = P
    ? new M.Arrow({ start: [0, rnPos[1] - 0.84, 0], end: [0, rfPos[1] + 0.84, 0], color: C.green, strokeWidth: 3 })
    : new M.Arrow({ start: [rnPos[0] + 2.25, rnPos[1], 0], end: [rfPos[0] - 3.1, rfPos[1], 0], color: C.green, strokeWidth: 3 });

  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(page1, pgArrow, page2)),
    new M.FadeIn(rNest), new M.Create(rArrow), new M.FadeIn(rFlat),
    ...fbox([
      ['FLATTENING', C.green],
      '1 nested record → 1 flat row per item',
      ['shared order fields repeated on every row', C.amber]
    ], C.green, P ? [0, -3.25, 0] : [0, -1.92, 0], P ? 7.3 : 10.6),
    ...say('1 NESTED RECORD → 1 ROW PER ITEM', C.green)
  );
}

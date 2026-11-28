// 10.2.2 Indicator variables: a neighborhood switch (live manim-web lesson).
// Beat i = sentence i (0-based, 42 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, showA, until, play } = L;
  // readable text everywhere: phone >= 15, laptop >= 14
  const T = (s, size = 30, ...r) => L.T(s, Math.max(size, P ? 15 : 14), ...r);
  const pill = (s, c, size = 20) => L.pill(s, c, Math.max(size, P ? 15 : 14));

  const PILL = P ? [0, 2.08, 0] : [0, 1.95, 0];
  const BOXP = P ? [0, 3.40, 0] : [4.35, 0.30, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 19);

  // Formula box: one box at a time; lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 18 : 19, lh = P ? 0.35 : 0.38;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.64, ht = rows.length * lh + 0.32;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.16 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.35;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function hideBox() {
    if (!boxNow) return [];
    const old = boxNow;
    boxNow = null;
    return [new M.FadeOut(old)];
  }

  // Helpers: redundant neighborhood cues (cyan circle = Cedar, amber square = Station), arrows, outlines, switches
  function cueMark(kind, pos, radius = 0.11) {
    if (kind === 'cedar') {
      const c = new M.Circle({ radius, color: C.cyan, strokeWidth: 2 });
      c.setFill(C.cyan, 1); c.moveTo(pos); return c;
    }
    const sq = new M.Rectangle({ width: radius * 1.85, height: radius * 1.85, color: C.amber, strokeWidth: 2 });
    sq.setFill(C.amber, 1); sq.moveTo(pos); return sq;
  }

  function plotMark(kind, pos, dim = false) {
    if (kind === 'cedar') {
      const halo = new M.Dot({ point: pos, radius: 0.25, color: C.cyan });
      halo.setFill(C.cyan, dim ? 0.08 : 0.22);
      const core = new M.Dot({ point: pos, radius: 0.115, color: C.cyan });
      core.setFill(C.cyan, dim ? 0.42 : 1);
      return { group: new M.VGroup(halo, core), halo, core, kind };
    }
    const halo = new M.RoundedRectangle({ width: 0.42, height: 0.42, cornerRadius: 0.08, color: C.amber, strokeWidth: 1 });
    halo.setFill(C.amber, dim ? 0.08 : 0.20); halo.setStrokeOpacity(dim ? 0.12 : 0.28); halo.moveTo(pos);
    const core = new M.Rectangle({ width: 0.21, height: 0.21, color: C.amber, strokeWidth: 2 });
    core.setFill(C.amber, dim ? 0.42 : 1); core.moveTo(pos);
    return { group: new M.VGroup(halo, core), halo, core, kind };
  }

  function makeArrow(p1, p2, color, strokeWidth = 3, tip = 0.11, both = false) {
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const z = p1[2] || 0;
    const parts = [new M.Line({ start: p1, end: p2, color, strokeWidth })];
    const addTip = (pt, dir) => {
      const bx = pt[0] - dir * ux * tip * 1.25, by = pt[1] - dir * uy * tip * 1.25;
      parts.push(new M.Line({ start: [bx + px * tip * 0.8, by + py * tip * 0.8, z], end: pt, color, strokeWidth }));
      parts.push(new M.Line({ start: [bx - px * tip * 0.8, by - py * tip * 0.8, z], end: pt, color, strokeWidth }));
    };
    addTip(p2, 1);
    if (both) addTip(p1, -1);
    return new M.VGroup(...parts);
  }

  function boxOutline(center, width, height, color, strokeWidth = 2.5, cornerRadius = 0.14, fillOp = 0.06) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius, color, strokeWidth });
    r.setFill(color, fillOp); r.moveTo(center); return r;
  }

  // Interactive-style toggle switch whose track and knob transform smoothly when flipped
  function makeSwitch(center, { w = 0.92, h = 0.42, state = 'neutral', onColor = C.amber, valX = 0.72, valSize = 26, stateY = -0.36, stateSize = 13 } = {}) {
    const [cx, cy] = center;
    const dx = w / 2 - h / 2;
    const trackStyle = st => {
      const col = st === 'on' ? onColor : C.muted;
      const tr = new M.RoundedRectangle({ width: w, height: h, cornerRadius: h / 2, color: col, strokeWidth: 2 });
      tr.setFill(st === 'on' ? onColor : C.card, st === 'on' ? 0.28 : 0.95);
      tr.moveTo([cx, cy, 0]);
      return tr;
    };
    const knobStyle = st => {
      const col = st === 'on' ? onColor : C.muted;
      const kx = st === 'on' ? cx + dx : st === 'off' ? cx - dx : cx;
      const kb = new M.Circle({ radius: h * 0.36, color: col, strokeWidth: 2 });
      kb.setFill(col, 1); kb.moveTo([kx, cy, 0.01]);
      return kb;
    };
    const track = trackStyle(state);
    const knob = knobStyle(state);
    let stateTxt = null, valTxt = null;
    if (state !== 'neutral') {
      const col = state === 'on' ? onColor : C.muted;
      stateTxt = T(state === 'on' ? 'ON' : 'OFF', stateSize, col, true, true);
      stateTxt.moveTo([cx, cy + stateY, 0]);
      valTxt = T(state === 'on' ? '1' : '0', valSize, state === 'on' ? onColor : C.ink, true, true);
      valTxt.moveTo([cx + valX, cy, 0]);
    }
    return {
      track, knob,
      get stateTxt() { return stateTxt; },
      get valTxt() { return valTxt; },
      fadeIn(runTime = 0.8) {
        const a = [new M.FadeIn(track, { runTime }), new M.FadeIn(knob, { runTime })];
        if (stateTxt) a.push(new M.FadeIn(stateTxt, { runTime }));
        if (valTxt) a.push(new M.FadeIn(valTxt, { runTime }));
        return a;
      },
      setState(nextState, nextOnColor = onColor, runTime = 0.65) {
        onColor = nextOnColor;
        const col = nextState === 'on' ? onColor : C.muted;
        const a = [
          new M.Transform(track, trackStyle(nextState), { runTime }),
          new M.Transform(knob, knobStyle(nextState), { runTime }),
        ];
        if (stateTxt) a.push(new M.FadeOut(stateTxt, { runTime: 0.4 }));
        if (valTxt) a.push(new M.FadeOut(valTxt, { runTime: 0.4 }));
        stateTxt = T(nextState === 'on' ? 'ON' : 'OFF', stateSize, col, true, true);
        stateTxt.moveTo([cx, cy + stateY, 0]);
        valTxt = T(nextState === 'on' ? '1' : '0', valSize, nextState === 'on' ? onColor : C.ink, true, true);
        valTxt.moveTo([cx + valX, cy, 0]);
        a.push(new M.FadeIn(stateTxt, { runTime }), new M.FadeIn(valTxt, { runTime }));
        return a;
      },
      fadeOut(runTime = 0.7) {
        const a = [new M.FadeOut(track, { runTime }), new M.FadeOut(knob, { runTime })];
        if (stateTxt) a.push(new M.FadeOut(stateTxt, { runTime }));
        if (valTxt) a.push(new M.FadeOut(valTxt, { runTime }));
        return a;
      }
    };
  }

  // =========================================================================
  // ACT 1: Two 40 m² cards side by side + the light switch (Beats 0–13)
  // =========================================================================

  // Beat 0: Imagine you want to compare Cedar and Station at the same apartment size.
  const b0Y = P ? -0.35 : 0.15;
  const b0DX = P ? 1.85 : 2.65;
  const b0W = P ? 2.95 : 3.35, b0H = 1.15;
  const cedarBadgeBg = new M.RoundedRectangle({ width: b0W, height: b0H, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2.5 });
  cedarBadgeBg.setFill(C.card, 0.95); cedarBadgeBg.moveTo([-b0DX, b0Y, 0]);
  const cedarBadgeCue = cueMark('cedar', [-b0DX - 0.78, b0Y, 0], 0.14);
  const cedarBadgeTxt = T('Cedar', P ? 26 : 28, C.cyan, false, true); cedarBadgeTxt.moveTo([-b0DX + 0.22, b0Y, 0]);
  const cedarBadge = new M.VGroup(cedarBadgeBg, cedarBadgeCue, cedarBadgeTxt);

  const stationBadgeBg = new M.RoundedRectangle({ width: b0W, height: b0H, cornerRadius: 0.18, color: C.amber, strokeWidth: 2.5 });
  stationBadgeBg.setFill(C.card, 0.95); stationBadgeBg.moveTo([b0DX, b0Y, 0]);
  const stationBadgeCue = cueMark('station', [b0DX - 0.92, b0Y, 0], 0.14);
  const stationBadgeTxt = T('Station', P ? 26 : 28, C.amber, false, true); stationBadgeTxt.moveTo([b0DX + 0.20, b0Y, 0]);
  const stationBadge = new M.VGroup(stationBadgeBg, stationBadgeCue, stationBadgeTxt);

  const vsTxt = T('vs', P ? 22 : 24, C.muted, false, true); vsTxt.moveTo([0, b0Y, 0]);
  const sameSizeTag = pill('SAME SIZE: 40 m²', C.violet, P ? 16 : 17);
  sameSizeTag.moveTo([0, P ? 0.85 : 1.10, 0]);

  await until(S(0));
  await play(
    new M.FadeIn(cedarBadge, { runTime: 0.9 }),
    new M.FadeIn(stationBadge, { runTime: 0.9 }),
    new M.FadeIn(vsTxt, { runTime: 0.9 }),
    new M.FadeIn(sameSizeTag, { runTime: 0.9 }),
    ...say('COMPARE CEDAR VS STATION', C.cyan)
  );

  // Beat 1: How can a rent rule use a neighborhood name in a calculation?
  const qY = P ? -2.25 : -1.35;
  const qBox = new M.RoundedRectangle({ width: P ? 6.8 : 8.2, height: 1.15, cornerRadius: 0.18, color: C.amber, strokeWidth: 2 });
  qBox.setFill(C.card, 0.95); qBox.moveTo([0, qY, 0]);
  const qLeft = T('rent =  ...  +', P ? 21 : 25, C.ink, true); qLeft.moveTo([P ? -1.45 : -1.75, qY, 0]);
  const qWordBox = new M.RoundedRectangle({ width: P ? 2.55 : 2.95, height: 0.66, cornerRadius: 0.12, color: C.pink, strokeWidth: 2 });
  qWordBox.setFill(C.pink, 0.15); qWordBox.moveTo([P ? 1.55 : 1.75, qY, 0]);
  const qWordTxt = T('"Station"  ?', P ? 20 : 23, C.pink, true, true); qWordTxt.moveTo([P ? 1.55 : 1.75, qY, 0]);
  const qGroup = new M.VGroup(qBox, qLeft, qWordBox, qWordTxt);

  await until(S(1));
  await play(
    new M.FadeIn(qGroup, { runTime: 0.9 }),
    ...say('HOW TO USE A NAME IN MATH?', C.amber)
  );

  // Beat 2: Put the two forty-square-metre cards side by side.
  const cW = P ? 3.55 : 4.2, cH = P ? 4.85 : 3.85;
  const cXL = P ? -1.88 : -2.55, cXR = P ? 1.88 : 2.55;
  const cY = P ? -1.45 : -0.50;
  const cTop = cY + cH / 2, cBot = cY - cH / 2;

  function makeCard(cx, { kind, name, id, rent, color }) {
    const bg = new M.RoundedRectangle({ width: cW, height: cH, cornerRadius: 0.18, color, strokeWidth: 2.5 });
    bg.setFill(C.card, 0.95); bg.moveTo([cx, cY, 0]);
    const headY = cTop - 0.44;
    const cue = cueMark(kind, [cx - cW / 2 + 0.38, headY, 0], 0.11);
    const title = T(name, P ? 22 : 24, color, false, true);
    title.moveTo([cx - cW / 2 + 0.66 + title.getWidth() / 2, headY, 0]);
    const idTag = T(id, P ? 14 : 15, C.muted, true);
    idTag.moveTo([cx + cW / 2 - 0.50, headY, 0]);
    const div1 = new M.Line({ start: [cx - cW / 2 + 0.22, cTop - 0.80, 0], end: [cx + cW / 2 - 0.22, cTop - 0.80, 0], color: C.line, strokeWidth: 1.5 });
    const areaY = cTop - (P ? 1.22 : 1.15);
    const areaTxt = T('Area: 40 m²', P ? 18 : 20, C.ink, false, true);
    areaTxt.moveTo([cx, areaY, 0]);
    const metaY = cTop - (P ? 1.74 : 1.60);
    const metaTxt = T('Age 10 yr · Walk 8 min', P ? 13 : 15, C.muted);
    metaTxt.moveTo([cx, metaY, 0]);
    const rentY = cTop - (P ? 2.40 : 2.16);
    const rentTxt = T(rent, P ? 30 : 34, color, true, true);
    rentTxt.moveTo([cx, rentY, 0]);
    const div2Y = cBot + (P ? 1.84 : 1.26);
    const div2 = new M.DashedLine({ start: [cx - cW / 2 + 0.22, div2Y, 0], end: [cx + cW / 2 - 0.22, div2Y, 0], color: C.line });
    return {
      cx, areaY, metaY, rentY, div2Y,
      bg, cue, title, idTag, div1, areaTxt, metaTxt, rentTxt, div2,
      parts: [bg, cue, title, idTag, div1, areaTxt, metaTxt, rentTxt, div2]
    };
  }

  const cardA = makeCard(cXL, { kind: 'cedar', name: 'Cedar', id: 'Card A', rent: '$980', color: C.cyan });
  const cardD = makeCard(cXR, { kind: 'station', name: 'Station', id: 'Card D', rent: '$1,020', color: C.amber });

  await until(S(2));
  await play(
    new M.FadeOut(cedarBadge, { runTime: 0.6 }),
    new M.FadeOut(stationBadge, { runTime: 0.6 }),
    new M.FadeOut(vsTxt, { runTime: 0.6 }),
    new M.FadeOut(sameSizeTag, { runTime: 0.6 }),
    new M.FadeOut(qGroup, { runTime: 0.6 }),
    ...cardA.parts.map(o => new M.FadeIn(o, { runTime: 0.9 })),
    ...cardD.parts.map(o => new M.FadeIn(o, { runTime: 0.9 })),
    ...say('TWO 40 m² CARDS SIDE BY SIDE', C.cyan)
  );

  // Beat 3: They show buildings of the same age and apartments with the same walk to transit.
  const metaHiA = boxOutline([cXL, cardA.metaY, 0], cW - 0.34, 0.44, C.violet, 2, 0.10, 0.10);
  const metaHiD = boxOutline([cXR, cardD.metaY, 0], cW - 0.34, 0.44, C.violet, 2, 0.10, 0.10);

  await until(S(3));
  await play(
    new M.Create(metaHiA, { runTime: 0.7 }),
    new M.Create(metaHiD, { runTime: 0.7 }),
    new M.Indicate(cardA.metaTxt, { color: C.violet, runTime: 0.9 }),
    new M.Indicate(cardD.metaTxt, { color: C.violet, runTime: 0.9 }),
    ...say('SAME AGE (10 yr) · SAME WALK (8 min)', C.violet)
  );

  // Beat 4: The Cedar listing asks nine hundred and eighty dollars.
  const rentHiA = boxOutline([cXL, cardA.rentY, 0], P ? 1.85 : 2.15, 0.68, C.cyan, 2.5, 0.14, 0.10);
  await until(S(4));
  await play(
    new M.FadeOut(metaHiA, { runTime: 0.5 }),
    new M.FadeOut(metaHiD, { runTime: 0.5 }),
    new M.Create(rentHiA, { runTime: 0.7 }),
    new M.Indicate(cardA.rentTxt, { color: C.cyan, runTime: 0.9 }),
    ...say('CEDAR (40 m²): $980', C.cyan)
  );

  // Beat 5: The Station listing asks one thousand and twenty dollars.
  const rentHiD = boxOutline([cXR, cardD.rentY, 0], P ? 2.15 : 2.50, 0.68, C.amber, 2.5, 0.14, 0.10);
  await until(S(5));
  await play(
    new M.FadeOut(rentHiA, { runTime: 0.5 }),
    new M.Create(rentHiD, { runTime: 0.7 }),
    new M.Indicate(cardD.rentTxt, { color: C.amber, runTime: 0.9 }),
    ...say('STATION (40 m²): $1,020', C.amber)
  );

  // Beat 6: Now place a switch on each card, like a switch for a light.
  const swY = cBot + (P ? 0.80 : 0.54);
  const swOffX = P ? -0.44 : -0.48;
  const swA = makeSwitch([cXL + swOffX, swY, 0], { w: P ? 0.92 : 1.04, h: P ? 0.42 : 0.44, state: 'neutral', onColor: C.amber, valX: P ? 1.15 : 1.25, valSize: P ? 30 : 34, stateY: P ? -0.42 : -0.35, stateSize: 13 });
  const swD = makeSwitch([cXR + swOffX, swY, 0], { w: P ? 0.92 : 1.04, h: P ? 0.42 : 0.44, state: 'neutral', onColor: C.amber, valX: P ? 1.15 : 1.25, valSize: P ? 30 : 34, stateY: P ? -0.42 : -0.35, stateSize: 13 });

  await until(S(6));
  await play(
    new M.FadeOut(rentHiD, { runTime: 0.5 }),
    ...swA.fadeIn(0.85),
    ...swD.fadeIn(0.85),
    ...say('PLACE A LIGHT SWITCH ON EACH CARD', C.violet)
  );

  // Beat 7: The switch asks whether the apartment is in Station.
  const swQY = cBot + (P ? 1.48 : 1.02);
  const swQA = T('In Station?', P ? 15 : 16, C.amber, false, true); swQA.moveTo([cXL, swQY, 0]);
  const swQD = T('In Station?', P ? 15 : 16, C.amber, false, true); swQD.moveTo([cXR, swQY, 0]);

  await until(S(7));
  await play(
    new M.FadeIn(swQA, { runTime: 0.8 }),
    new M.FadeIn(swQD, { runTime: 0.8 }),
    ...say('SWITCH ASKS: "IN STATION?"', C.amber)
  );

  // Beat 8: On the Cedar card the switch is off, so write zero.
  await until(S(8));
  await play(
    ...swA.setState('off', C.amber, 0.7),
    ...say('CEDAR: SWITCH OFF → 0', C.cyan)
  );

  // Beat 9: On the Station card the switch is on, so write one.
  await until(S(9));
  await play(
    ...swD.setState('on', C.amber, 0.7),
    new M.Flash(swD.knob, { color: C.amber, flashRadius: 0.25, runTime: 0.8 }),
    ...say('STATION: SWITCH ON → 1', C.amber)
  );

  // Beat 10: A detail that can change between cards is a variable.
  const diffArrow = makeArrow([cXL + cW / 2 - 0.12, swY, 0], [cXR - cW / 2 + 0.12, swY, 0], C.violet, 2.5, 0.09, true);
  await until(S(10));
  await play(
    new M.Create(diffArrow, { runTime: 0.6 }),
    new M.Indicate(swA.valTxt, { color: C.violet, runTime: 0.9 }),
    new M.Indicate(swD.valTxt, { color: C.violet, runTime: 0.9 }),
    ...say('VARIABLE = DETAIL THAT CAN CHANGE', C.violet)
  );

  // Beat 11: A zero-or-one variable that marks a group is an indicator variable.
  const indBoxA = boxOutline([cXL, cBot + (P ? 0.92 : 0.62), 0], cW - 0.30, P ? 1.56 : 1.06, C.green, 2.5, 0.14, 0.07);
  const indBoxD = boxOutline([cXR, cBot + (P ? 0.92 : 0.62), 0], cW - 0.30, P ? 1.56 : 1.06, C.green, 2.5, 0.14, 0.07);

  await until(S(11));
  await play(
    new M.FadeOut(diffArrow, { runTime: 0.5 }),
    new M.Create(indBoxA, { runTime: 0.75 }),
    new M.Create(indBoxD, { runTime: 0.75 }),
    ...say('0-OR-1 GROUP SWITCH = INDICATOR VARIABLE', C.green)
  );

  // Beat 12: The group with the switch off is the starting group, called the reference.
  const refBadge1 = pill('REFERENCE (0)', C.cyan, P ? 15 : 16);
  refBadge1.moveTo([cXL, cBot - 0.36, 0]);

  await until(S(12));
  await play(
    new M.FadeOut(indBoxD, { runTime: 0.55 }),
    new M.FadeOut(indBoxA, { runTime: 0.55 }),
    new M.FadeIn(refBadge1, { runTime: 0.8 }),
    ...say('SWITCH OFF (0) = REFERENCE GROUP', C.cyan)
  );

  // Beat 13: Cedar is our reference. (1.95s gap -> keep fast!)
  const refFrameA = boxOutline([cXL, cY, 0], cW + 0.16, cH + 0.16, C.cyan, 3, 0.22, 0.04);
  await until(S(13));
  await play(
    new M.Create(refFrameA, { runTime: 0.65 }),
    new M.Indicate(refBadge1, { color: C.cyan, runTime: 0.75 }),
    ...say('CEDAR IS OUR REFERENCE', C.cyan)
  );

  // =========================================================================
  // ACT 2: Matched pairs on the Rent-vs-Area chart + fitted rule (Beats 14–26)
  // =========================================================================

  // Chart coordinates
  const AX_X0 = P ? -2.35 : -5.35, AX_X1 = P ? 3.10 : 1.35;
  const AX_Y0 = P ? -2.55 : -2.15, AX_Y1 = P ? 1.30 : 1.25;
  const X40 = P ? -0.75 : -3.45, X50 = P ? 1.65 : -0.35;
  const XMID = (X40 + X50) / 2;
  const r2y = r => AX_Y0 + (r - 940) / 230 * (AX_Y1 - AX_Y0);

  const xAxis = new M.Line({ start: [AX_X0, AX_Y0, 0], end: [AX_X1, AX_Y0, 0], color: C.muted, strokeWidth: 2.5 });
  const yAxis = new M.Line({ start: [AX_X0, AX_Y0, 0], end: [AX_X0, AX_Y1, 0], color: C.muted, strokeWidth: 2.5 });
  const yTicks = [];
  for (const r of [950, 1000, 1050, 1100, 1150]) {
    const yy = r2y(r);
    const tk = new M.Line({ start: [AX_X0 - 0.08, yy, 0], end: [AX_X0 + 0.08, yy, 0], color: C.muted, strokeWidth: 2 });
    const gl = new M.Line({ start: [AX_X0, yy, -0.01], end: [AX_X1, yy, -0.01], color: C.grid, strokeWidth: 1 });
    gl.setStrokeOpacity(0.32);
    const lb = T('$' + r.toLocaleString('en-US'), P ? 13 : 14, C.muted, true);
    lb.moveTo([AX_X0 - 0.56, yy, 0]);
    yTicks.push(tk, gl, lb);
  }
  const xTk40 = new M.Line({ start: [X40, AX_Y0 - 0.08, 0], end: [X40, AX_Y0 + 0.08, 0], color: C.muted, strokeWidth: 2 });
  const xTk50 = new M.Line({ start: [X50, AX_Y0 - 0.08, 0], end: [X50, AX_Y0 + 0.08, 0], color: C.muted, strokeWidth: 2 });
  const xLb40 = T('40 m²', P ? 16 : 17, C.ink, true, true); xLb40.moveTo([X40, AX_Y0 - 0.30, 0]);
  const xLb50 = T('50 m²', P ? 16 : 17, C.ink, true, true); xLb50.moveTo([X50, AX_Y0 - 0.30, 0]);
  const yTitle = T('Rent', P ? 14 : 15, C.muted); yTitle.moveTo([AX_X0 - 0.45, AX_Y1 + 0.16, 0]);

  // Observed dots (Cards A, D, E, H)
  const ptA = plotMark('cedar', [X40, r2y(980), 0]);
  const ptD = plotMark('station', [X40, r2y(1020), 0]);
  const ptE = plotMark('cedar', [X50, r2y(1060), 0]);
  const ptH = plotMark('station', [X50, r2y(1140), 0]);

  const obsLbA = T('$980', P ? 15 : 16, C.cyan, true); obsLbA.moveTo([X40 - 0.62, r2y(980), 0]);
  const obsLbD = T('$1,020', P ? 15 : 16, C.amber, true); obsLbD.moveTo([X40 - 0.66, r2y(1020), 0]);
  const obsLbE = T('$1,060', P ? 15 : 16, C.cyan, true); obsLbE.moveTo([X50 + 0.68, r2y(1060), 0]);
  const obsLbH = T('$1,140', P ? 15 : 16, C.amber, true); obsLbH.moveTo([X50 + 0.68, r2y(1140), 0]);

  // Mini live switch panel (bottom on Phone, lower-right on Laptop)
  const spHeaderPos = P ? [0, -3.68, 0] : [4.35, -1.08, 0];
  let spHeader = T('Switch: In Station?', P ? 16 : 16, C.amber, false, true);
  spHeader.moveTo(spHeaderPos);

  const msY = P ? -4.46 : -1.96;
  const msXL = P ? -1.78 : 3.28, msXR = P ? 1.78 : 5.42;
  const msW = P ? 3.20 : 2.02, msH = P ? 1.06 : 1.16;

  function makeMiniCard(cx, kind, name, color) {
    const bg = new M.RoundedRectangle({ width: msW, height: msH, cornerRadius: 0.14, color, strokeWidth: 2 });
    bg.setFill(C.card, 0.95); bg.moveTo([cx, msY, 0]);
    const topY = msY + msH / 2 - 0.25;
    const cue = cueMark(kind, [cx - msW / 2 + 0.28, topY, 0], 0.085);
    const lb = T(name, P ? 15 : 15, color, false, true);
    lb.moveTo([cx - msW / 2 + 0.50 + lb.getWidth() / 2, topY, 0]);
    const sw = makeSwitch([cx - (P ? 0.45 : 0.30), msY - 0.20, 0], {
      w: P ? 0.80 : 0.72, h: P ? 0.34 : 0.32, state: kind === 'station' ? 'on' : 'off',
      onColor: C.amber, valX: P ? 0.92 : 0.74, valSize: P ? 22 : 21, stateY: 0.36, stateSize: 11
    });
    // Place OFF/ON cleanly beside the top-right inside mini card
    sw.stateTxt.moveTo([cx + msW / 2 - 0.38, topY, 0]);
    return { cx, topY, bg, cue, lb, sw, parts: [bg, cue, lb] };
  }
  const miniC = makeMiniCard(msXL, 'cedar', 'Cedar', C.cyan);
  const miniS = makeMiniCard(msXR, 'station', 'Station', C.amber);

  // Helper to update mini-switch state while keeping ON/OFF in top-right of mini card
  function flipMini(mc, nextState, nextColor, runTime = 0.65) {
    const anims = mc.sw.setState(nextState, nextColor, runTime);
    mc.sw.stateTxt.moveTo([mc.cx + msW / 2 - 0.38, mc.topY, 0]);
    return anims;
  }

  let refTag = pill('REF', C.cyan, 13);
  refTag.moveTo([msXL, msY - msH / 2 - 0.26, 0]);

  const act1All = [
    ...cardA.parts, ...cardD.parts, swQA, swQD, refBadge1, refFrameA
  ];

  // Beat 14: Bring back the other matched pair, at fifty square metres.
  await until(S(14));
  await play(
    ...act1All.map(o => new M.FadeOut(o, { runTime: 0.6 })),
    ...swA.fadeOut(0.6),
    ...swD.fadeOut(0.6),
    new M.Create(xAxis, { runTime: 0.8 }),
    new M.Create(yAxis, { runTime: 0.8 }),
    ...yTicks.map(o => new M.FadeIn(o, { runTime: 0.8 })),
    new M.FadeIn(xTk40, { runTime: 0.8 }), new M.FadeIn(xTk50, { runTime: 0.8 }),
    new M.FadeIn(xLb40, { runTime: 0.8 }), new M.FadeIn(xLb50, { runTime: 0.8 }),
    new M.FadeIn(yTitle, { runTime: 0.8 }),
    new M.FadeIn(ptA.group, { runTime: 0.9 }), new M.FadeIn(obsLbA, { runTime: 0.9 }),
    new M.FadeIn(ptD.group, { runTime: 0.9 }), new M.FadeIn(obsLbD, { runTime: 0.9 }),
    new M.FadeIn(ptE.group, { runTime: 0.9 }), new M.FadeIn(obsLbE, { runTime: 0.9 }),
    new M.FadeIn(ptH.group, { runTime: 0.9 }), new M.FadeIn(obsLbH, { runTime: 0.9 }),
    new M.FadeIn(spHeader, { runTime: 0.8 }),
    ...miniC.parts.map(o => new M.FadeIn(o, { runTime: 0.8 })), ...miniC.sw.fadeIn(0.8),
    ...miniS.parts.map(o => new M.FadeIn(o, { runTime: 0.8 })), ...miniS.sw.fadeIn(0.8),
    new M.FadeIn(refTag, { runTime: 0.8 }),
    ...say('BOTH MATCHED PAIRS: 40 m² AND 50 m²', C.cyan)
  );

  // Beat 15: Station asks forty dollars more in the smaller pair.
  const gap40Arr = makeArrow([X40 + 0.24, r2y(980), 0], [X40 + 0.24, r2y(1020), 0], C.amber, 2.8, 0.10);
  const gap40Lb = T('+$40', P ? 16 : 17, C.amber, true, true);
  gap40Lb.moveTo([X40 + 0.74, r2y(1000), 0]);

  await until(S(15));
  await play(
    new M.Create(gap40Arr, { runTime: 0.8 }),
    new M.FadeIn(gap40Lb, { runTime: 0.8 }),
    new M.Indicate(ptA.group, { color: C.cyan, runTime: 0.8 }),
    new M.Indicate(ptD.group, { color: C.amber, runTime: 0.8 }),
    ...say('AT 40 m²: STATION IS +$40', C.amber)
  );

  // Beat 16: Station asks eighty dollars more in the larger pair.
  const gap80Arr = makeArrow([X50 - 0.24, r2y(1060), 0], [X50 - 0.24, r2y(1140), 0], C.amber, 2.8, 0.10);
  const gap80Lb = T('+$80', P ? 16 : 17, C.amber, true, true);
  gap80Lb.moveTo([X50 - 0.74, r2y(1100), 0]);

  await until(S(16));
  await play(
    new M.Create(gap80Arr, { runTime: 0.8 }),
    new M.FadeIn(gap80Lb, { runTime: 0.8 }),
    new M.Indicate(ptE.group, { color: C.cyan, runTime: 0.8 }),
    new M.Indicate(ptH.group, { color: C.amber, runTime: 0.8 }),
    ...say('AT 50 m²: STATION IS +$80', C.amber)
  );

  // Beat 17: Our fitted rule uses one gap for both pairs.
  const fitLineC = new M.Line({ start: [X40, r2y(970), 0], end: [X50, r2y(1070), 0], color: C.cyan, strokeWidth: 3.5 });
  const fitLineS = new M.Line({ start: [X40, r2y(1030), 0], end: [X50, r2y(1130), 0], color: C.amber, strokeWidth: 3.5 });
  const midGapArr = makeArrow([XMID, r2y(1020), 0], [XMID, r2y(1080), 0], C.violet, 2.8, 0.10, true);
  const midGapQ = T('one gap', P ? 14 : 15, C.violet, true, true);
  midGapQ.moveTo([XMID, r2y(1050) + 0.02, 0]);
  // Put label cleanly to the right of midGapArr so it never crosses the shaft
  midGapQ.moveTo([XMID + 0.62, r2y(1050), 0]);

  await until(S(17));
  await play(
    new M.Create(fitLineC, { runTime: 0.9 }),
    new M.Create(fitLineS, { runTime: 0.9 }),
    new M.Create(midGapArr, { runTime: 0.8 }),
    new M.FadeIn(midGapQ, { runTime: 0.8 }),
    ...say('FITTED RULE: ONE GAP FOR BOTH PAIRS', C.violet)
  );

  // Beat 18: In these matched pairs, the fitted gap is halfway between forty and eighty dollars.
  await until(S(18));
  await play(
    new M.Indicate(gap40Lb, { color: C.amber, runTime: 0.9 }),
    new M.Indicate(gap80Lb, { color: C.amber, runTime: 0.9 }),
    ...fbox([
      '40 m² gap = +$40',
      '50 m² gap = +$80',
      ['halfway   = (40 + 80) ÷ 2', C.amber]
    ], C.amber),
    ...say('HALFWAY BETWEEN $40 AND $80', C.amber)
  );

  // Beat 19: That makes the Station gap sixty dollars.
  const midGap60Arr = makeArrow([XMID, r2y(1020), 0], [XMID, r2y(1080), 0], C.amber, 3.2, 0.11);
  const midGap60Lb = T('+$60', P ? 17 : 18, C.amber, true, true);
  midGap60Lb.moveTo([XMID + 0.50, r2y(1050), 0]);

  await until(S(19));
  await play(
    new M.FadeOut(gap40Arr, { runTime: 0.5 }), new M.FadeOut(gap40Lb, { runTime: 0.5 }),
    new M.FadeOut(gap80Arr, { runTime: 0.5 }), new M.FadeOut(gap80Lb, { runTime: 0.5 }),
    new M.FadeOut(midGapArr, { runTime: 0.5 }), new M.FadeOut(midGapQ, { runTime: 0.5 }),
    new M.Create(midGap60Arr, { runTime: 0.75 }),
    new M.FadeIn(midGap60Lb, { runTime: 0.75 }),
    ...fbox([
      'halfway = (40 + 80) ÷ 2',
      ['Station gap = +$60', C.amber]
    ], C.amber),
    ...say('STATION GAP = +$60', C.amber)
  );

  // Beat 20: The rule starts at nine hundred and seventy dollars for small Cedar.
  // Dim observed points gently and clear observed price tags so fitted values read cleanly
  const fitPtC40 = plotMark('cedar', [X40, r2y(970), 0]);
  const fitLbC40 = T('$970', P ? 16 : 17, C.cyan, true, true);
  fitLbC40.moveTo([X40 - 0.74, r2y(970), 0]);

  await until(S(20));
  for (const pt of [ptA, ptD, ptE, ptH]) {
    const col = pt.kind === 'cedar' ? C.cyan : C.amber;
    pt.halo.setFill(col, 0.10);
    pt.core.setFill(col, 0.60);
    pt.core.setStroke(col, 1, 0.60);
  }
  await play(
    new M.FadeOut(obsLbA, { runTime: 0.5 }), new M.FadeOut(obsLbD, { runTime: 0.5 }),
    new M.FadeOut(obsLbE, { runTime: 0.5 }), new M.FadeOut(obsLbH, { runTime: 0.5 }),
    new M.FadeIn(fitPtC40.group, { runTime: 0.8 }),
    new M.FadeIn(fitLbC40, { runTime: 0.8 }),
    new M.Flash(fitPtC40.core, { color: C.cyan, flashRadius: 0.22, runTime: 0.8 }),
    ...fbox([
      'start (40 m² Cedar):',
      ['  $970', C.cyan]
    ], C.cyan),
    ...say('START AT $970 FOR SMALL CEDAR', C.cyan)
  );

  // Beat 21: A size step is ten extra square metres above forty.
  const stepY = AX_Y0 - 0.30;
  const stepArr = makeArrow([X40 + 0.56, stepY, 0], [X50 - 0.56, stepY, 0], C.green, 2.5, 0.09);
  const stepLb = T('+10 m²', P ? 13 : 14, C.green, true, true);
  stepLb.moveTo([XMID, stepY - 0.24, 0]);

  await until(S(21));
  await play(
    new M.Create(stepArr, { runTime: 0.8 }),
    new M.FadeIn(stepLb, { runTime: 0.8 }),
    ...fbox([
      'start = $970',
      ['1 size step = +10 m²', C.green]
    ], C.green),
    ...say('1 SIZE STEP = +10 m² ABOVE 40', C.green)
  );

  // Beat 22: At forty square metres, there is no extra area, so there are zero size steps.
  const step0Lb = T('0 steps', P ? 13 : 14, C.cyan, true, true);
  step0Lb.moveTo([X40, AX_Y0 - 0.62, 0]);

  await until(S(22));
  await play(
    new M.FadeIn(step0Lb, { runTime: 0.8 }),
    new M.Indicate(xLb40, { color: C.cyan, runTime: 0.8 }),
    ...fbox([
      'at 40 m²:',
      ['size steps = 0', C.cyan]
    ], C.cyan),
    ...say('AT 40 m²: 0 SIZE STEPS', C.cyan)
  );

  // Beat 23: In Cedar, sixty dollars times zero adds nothing to the starting rent.
  await until(S(23));
  await play(
    new M.Indicate(miniC.sw.valTxt, { color: C.cyan, runTime: 0.9 }),
    new M.Flash(fitPtC40.core, { color: C.cyan, flashRadius: 0.24, runTime: 0.9 }),
    ...fbox([
      'Cedar (switch = 0):',
      ['970 + 60 × 0 = $970', C.cyan]
    ], C.cyan),
    ...say('CEDAR: $60 × 0 = +$0', C.cyan)
  );

  // Beat 24: In Station, sixty dollars times one adds sixty dollars.
  const jump40Arr = makeArrow([X40 + 0.18, r2y(970), 0], [X40 + 0.18, r2y(1030), 0], C.amber, 3.2, 0.10);
  const jump40Lb = T('+$60', P ? 15 : 16, C.amber, true, true);
  jump40Lb.moveTo([X40 + 0.64, r2y(1000), 0]);

  await until(S(24));
  await play(
    new M.Indicate(miniS.sw.valTxt, { color: C.amber, runTime: 0.9 }),
    new M.Create(jump40Arr, { runTime: 0.85 }),
    new M.FadeIn(jump40Lb, { runTime: 0.85 }),
    ...fbox([
      'Station (switch = 1):',
      ['970 + 60 × 1', C.amber]
    ], C.amber),
    ...say('STATION: $60 × 1 = +$60', C.amber)
  );

  // Beat 25: The result for small Station is one thousand and thirty dollars.
  const fitPtS40 = plotMark('station', [X40, r2y(1030), 0]);
  const fitLbS40 = T('$1,030', P ? 16 : 17, C.amber, true, true);
  fitLbS40.moveTo([X40 - 0.84, r2y(1030), 0]);

  await until(S(25));
  await play(
    new M.FadeOut(jump40Arr, { runTime: 0.5 }),
    new M.FadeOut(jump40Lb, { runTime: 0.5 }),
    new M.FadeIn(fitPtS40.group, { runTime: 0.8 }),
    new M.FadeIn(fitLbS40, { runTime: 0.8 }),
    new M.Flash(fitPtS40.core, { color: C.amber, flashRadius: 0.24, runTime: 0.8 }),
    ...fbox([
      'Station (40 m²):',
      ['970 + 60 = $1,030', C.amber]
    ], C.amber),
    ...say('SMALL STATION: $1,030', C.amber)
  );

  // Beat 26: For fifty square metres, both predictions rise by one hundred dollars.
  const step1Lb = T('1 step', P ? 13 : 14, C.green, true, true);
  step1Lb.moveTo([X50, AX_Y0 - 0.62, 0]);
  const fitPtC50 = plotMark('cedar', [X50, r2y(1070), 0]);
  const fitLbC50 = T('$1,070', P ? 16 : 17, C.cyan, true, true);
  fitLbC50.moveTo([X50 + 0.68, r2y(1070), 0]);
  const fitPtS50 = plotMark('station', [X50, r2y(1130), 0]);
  const fitLbS50 = T('$1,130', P ? 16 : 17, C.amber, true, true);
  fitLbS50.moveTo([X50 + 0.68, r2y(1130), 0]);
  const riseLbTop = T('+$100', P ? 14 : 15, C.green, true, true);
  riseLbTop.moveTo([XMID - 0.10, r2y(1105) + 0.26, 0]);
  const riseLbBot = T('+$100', P ? 14 : 15, C.green, true, true);
  riseLbBot.moveTo([XMID + 0.62, r2y(1020) - 0.42, 0]);

  await until(S(26));
  await play(
    new M.FadeIn(step1Lb, { runTime: 0.8 }),
    new M.FadeIn(fitPtC50.group, { runTime: 0.85 }), new M.FadeIn(fitLbC50, { runTime: 0.85 }),
    new M.FadeIn(fitPtS50.group, { runTime: 0.85 }), new M.FadeIn(fitLbS50, { runTime: 0.85 }),
    new M.FadeIn(riseLbTop, { runTime: 0.85 }), new M.FadeIn(riseLbBot, { runTime: 0.85 }),
    ...fbox([
      'at 50 m² (+$100 each):',
      ['Cedar:   $1,070', C.cyan],
      ['Station: $1,130', C.amber]
    ], C.green),
    ...say('AT 50 m²: BOTH RISE BY +$100', C.green)
  );

  // =========================================================================
  // ACT 3: The full rule in short (Beats 27–30)
  // =========================================================================

  // Beat 27: Now say the full rule in short. (2.13s gap -> keep fast!)
  await until(S(27));
  await play(
    ...fbox([['Full rent rule:', C.cyan]], C.cyan),
    ...say('THE FULL RULE IN SHORT', C.cyan)
  );

  // Beat 28: Predicted rent equals the starting rent plus the size amount plus the neighborhood amount.
  await until(S(28));
  await play(
    ...fbox([
      ['rent = start', C.cyan],
      ['     + size amount', C.green],
      ['     + neighborhood amount', C.amber]
    ], C.cyan),
    ...say('START + SIZE + NEIGHBORHOOD', C.cyan)
  );

  // Beat 29: The size amount is one hundred dollars times the number of ten-square-metre steps above forty.
  await until(S(29));
  await play(
    new M.Indicate(riseLbTop, { color: C.green, runTime: 0.9 }),
    new M.Indicate(riseLbBot, { color: C.green, runTime: 0.9 }),
    ...fbox([
      ['rent = $970', C.cyan],
      ['     + $100 × size steps', C.green],
      ['     + neighborhood amount', C.muted]
    ], C.green),
    ...say('SIZE = $100 × STEPS ABOVE 40', C.green)
  );

  // Beat 30: The neighborhood amount is sixty dollars times the Station indicator.
  await until(S(30));
  await play(
    new M.Indicate(midGap60Lb, { color: C.amber, runTime: 0.9 }),
    new M.Indicate(miniS.sw.valTxt, { color: C.amber, runTime: 0.9 }),
    ...fbox([
      ['rent = $970', C.cyan],
      ['     + $100 × size steps', C.green],
      ['     + $60 × Station (0/1)', C.amber]
    ], C.amber),
    ...say('NEIGHBORHOOD = $60 × STATION SWITCH', C.amber)
  );

  // =========================================================================
  // ACT 4: Flip the reference to Station (Beats 31–37)
  // =========================================================================

  // Beat 31: You can choose Station as the reference instead. (2.83s gap)
  const refTagNew = pill('REF', C.amber, 13);
  refTagNew.moveTo([msXR, msY - msH / 2 - 0.26, 0]);

  await until(S(31));
  await play(
    new M.FadeOut(refTag, { runTime: 0.55 }),
    new M.FadeIn(refTagNew, { runTime: 0.75 }),
    new M.Indicate(miniS.bg, { color: C.amber, runTime: 0.8 }),
    ...say('FLIP: MAKE STATION THE REFERENCE', C.amber)
  );
  refTag = refTagNew;

  // Beat 32: The switch now asks whether the apartment is in Cedar.
  const spHeader2 = T('Switch: In Cedar?', P ? 16 : 16, C.cyan, false, true);
  spHeader2.moveTo(spHeaderPos);

  await until(S(32));
  await play(
    new M.FadeOut(spHeader, { runTime: 0.5 }),
    new M.FadeIn(spHeader2, { runTime: 0.7 }),
    ...flipMini(miniS, 'off', C.cyan, 0.7),
    ...flipMini(miniC, 'on', C.cyan, 0.7),
    ...say('NEW SWITCH ASKS: "IN CEDAR?"', C.cyan)
  );
  spHeader = spHeader2;

  // Beat 33: Start at one thousand and thirty dollars for forty square metres.
  await until(S(33));
  await play(
    new M.Flash(fitPtS40.core, { color: C.amber, flashRadius: 0.26, runTime: 0.9 }),
    new M.Indicate(fitLbS40, { color: C.amber, runTime: 0.9 }),
    ...fbox([
      'reference = Station',
      ['start (40 m²) = $1,030', C.amber]
    ], C.amber),
    ...say('NEW START (40 m² STATION): $1,030', C.amber)
  );

  // Beat 34: The Cedar switch now subtracts sixty dollars when it is on.
  const midGapNegArr = makeArrow([XMID, r2y(1080), 0], [XMID, r2y(1020), 0], C.cyan, 3.2, 0.11);
  const midGapNegLb = T('−$60', P ? 17 : 18, C.cyan, true, true);
  midGapNegLb.moveTo([XMID + 0.50, r2y(1050), 0]);

  await until(S(34));
  await play(
    new M.FadeOut(midGap60Arr, { runTime: 0.5 }),
    new M.FadeOut(midGap60Lb, { runTime: 0.5 }),
    new M.Create(midGapNegArr, { runTime: 0.8 }),
    new M.FadeIn(midGapNegLb, { runTime: 0.8 }),
    ...fbox([
      ['rent = $1,030', C.amber],
      ['     + $100 × size steps', C.green],
      ['     − $60 × Cedar (0/1)', C.cyan]
    ], C.cyan),
    ...say('CEDAR ON (1) → SUBTRACT $60', C.cyan)
  );

  // Beat 35: At forty square metres, Cedar still gets nine hundred and seventy dollars.
  const drop40Arr = makeArrow([X40 + 0.18, r2y(1030), 0], [X40 + 0.18, r2y(970), 0], C.cyan, 3.0, 0.10);
  const drop40Lb = T('−$60', P ? 15 : 16, C.cyan, true, true);
  drop40Lb.moveTo([X40 + 0.64, r2y(1000), 0]);

  await until(S(35));
  await play(
    new M.Create(drop40Arr, { runTime: 0.8 }),
    new M.FadeIn(drop40Lb, { runTime: 0.8 }),
    new M.Flash(fitPtC40.core, { color: C.cyan, flashRadius: 0.25, runTime: 0.85 }),
    ...fbox([
      'Cedar (40 m², switch = 1):',
      ['1,030 − 60 × 1 = $970', C.cyan]
    ], C.cyan),
    ...say('40 m² CEDAR STILL = $970', C.cyan)
  );

  // Beat 36: Both forty-square-metre predictions stay the same.
  const same40Box = boxOutline([X40 - 0.30, r2y(1000), 0], 1.68, r2y(1030) - r2y(970) + 0.62, C.green, 2.5, 0.16, 0.06);

  await until(S(36));
  await play(
    new M.FadeOut(drop40Arr, { runTime: 0.5 }),
    new M.FadeOut(drop40Lb, { runTime: 0.5 }),
    new M.Create(same40Box, { runTime: 0.8 }),
    new M.Indicate(fitLbC40, { color: C.green, runTime: 0.8 }),
    new M.Indicate(fitLbS40, { color: C.green, runTime: 0.8 }),
    ...fbox([
      '40 m² predictions:',
      ['Cedar:   $970   (same)', C.cyan],
      ['Station: $1,030 (same)', C.amber]
    ], C.green),
    ...say('BOTH 40 m² PREDICTIONS UNCHANGED', C.green)
  );

  // Beat 37: The size amount also stays the same, so all the predictions agree.
  const same50Box = boxOutline([X50 + 0.32, r2y(1100), 0], 1.72, r2y(1130) - r2y(1070) + 0.62, C.green, 2.5, 0.16, 0.06);

  await until(S(37));
  await play(
    new M.Create(same50Box, { runTime: 0.75 }),
    new M.LaggedStart([
      new M.Indicate(fitPtC40.group, { color: C.green }),
      new M.Indicate(fitPtS40.group, { color: C.green }),
      new M.Indicate(fitPtC50.group, { color: C.green }),
      new M.Indicate(fitPtS50.group, { color: C.green })
    ], { lagRatio: 0.14, runTime: 1.2 }),
    ...fbox([
      'same +$100 per step:',
      ['40 m²: $970, $1,030', C.ink],
      ['50 m²: $1,070, $1,130', C.ink],
      ['all predictions agree!', C.green]
    ], C.green),
    ...say('ALL FOUR PREDICTIONS AGREE', C.green)
  );

  // =========================================================================
  // ACT 5: What it is for, the common trap, and recap (Beats 38–41)
  // =========================================================================

  const act2to4All = [
    xAxis, yAxis, ...yTicks, xTk40, xTk50, xLb40, xLb50, yTitle,
    ptA.group, ptD.group, ptE.group, ptH.group,
    fitLineC, fitLineS, midGapNegArr, midGapNegLb,
    fitPtC40.group, fitLbC40, fitPtS40.group, fitLbS40,
    fitPtC50.group, fitLbC50, fitPtS50.group, fitLbS50,
    stepArr, stepLb, step0Lb, step1Lb, riseLbTop, riseLbBot,
    same40Box, same50Box, spHeader, refTag,
    ...miniC.parts, ...miniS.parts
  ];

  // Beat 38: Use indicators when the calculator needs a number for a named group.
  const b38Objs = [];
  let swOneCardPos, swOneCardW, swOneCardH;
  if (!P) {
    // Laptop horizontal flow: Named groups -> 0/1 Switches -> Calculator
    const g1 = boxOutline([-4.45, 0.35, 0], 2.35, 0.96, C.cyan, 2.2, 0.14, 0.92); g1.setFill(C.card, 0.95);
    const g1c = cueMark('cedar', [-5.22, 0.35, 0], 0.11);
    const g1t = T('Cedar', 22, C.cyan, false, true); g1t.moveTo([-4.28, 0.35, 0]);
    const g2 = boxOutline([-4.45, -1.05, 0], 2.35, 0.96, C.amber, 2.2, 0.14, 0.92); g2.setFill(C.card, 0.95);
    const g2c = cueMark('station', [-5.22, -1.05, 0], 0.11);
    const g2t = T('Station', 22, C.amber, false, true); g2t.moveTo([-4.20, -1.05, 0]);

    const a1 = makeArrow([-3.15, 0.35, 0], [-1.85, 0.35, 0], C.cyan, 2.5, 0.10);
    const a2 = makeArrow([-3.15, -1.05, 0], [-1.85, -1.05, 0], C.amber, 2.5, 0.10);

    const s1 = boxOutline([-0.55, 0.35, 0], 2.30, 0.96, C.muted, 2.2, 0.14, 0.92); s1.setFill(C.card, 0.95);
    const s1t = T('OFF  →  0', 22, C.muted, true, true); s1t.moveTo([-0.55, 0.35, 0]);
    swOneCardPos = [-0.55, -1.05, 0]; swOneCardW = 2.30; swOneCardH = 0.96;
    const s2 = boxOutline(swOneCardPos, swOneCardW, swOneCardH, C.amber, 2.5, 0.14, 0.92); s2.setFill(C.card, 0.95);
    const s2t = T('ON   →  1', 22, C.amber, true, true); s2t.moveTo(swOneCardPos);

    const a3 = makeArrow([0.72, 0.35, 0], [2.05, -0.10, 0], C.muted, 2.5, 0.10);
    const a4 = makeArrow([0.72, -1.05, 0], [2.05, -0.60, 0], C.amber, 2.5, 0.10);

    const calc = boxOutline([4.15, -0.35, 0], 3.85, 2.25, C.cyan, 2.5, 0.18, 0.92); calc.setFill(C.card, 0.95);
    const calcH = T('Rent Calculator', 20, C.cyan, false, true); calcH.moveTo([4.15, 0.30, 0]);
    const calcF = T('$970 + $100x + $60(s)', 17, C.ink, true); calcF.moveTo([4.15, -0.45, 0]);
    const calcN = T('needs a number', 15, C.muted); calcN.moveTo([4.15, -1.05, 0]);
    b38Objs.push(g1, g1c, g1t, g2, g2c, g2t, a1, a2, s1, s1t, s2, s2t, a3, a4, calc, calcH, calcF, calcN);
  } else {
    // Phone vertical flow: Named groups -> 0/1 Switches -> Calculator
    const g1 = boxOutline([-1.75, 0.55, 0], 3.05, 0.92, C.cyan, 2.2, 0.14, 0.92); g1.setFill(C.card, 0.95);
    const g1c = cueMark('cedar', [-2.68, 0.55, 0], 0.11);
    const g1t = T('Cedar', 21, C.cyan, false, true); g1t.moveTo([-1.55, 0.55, 0]);
    const g2 = boxOutline([1.75, 0.55, 0], 3.05, 0.92, C.amber, 2.2, 0.14, 0.92); g2.setFill(C.card, 0.95);
    const g2c = cueMark('station', [0.80, 0.55, 0], 0.11);
    const g2t = T('Station', 21, C.amber, false, true); g2t.moveTo([1.95, 0.55, 0]);

    const a1 = makeArrow([-1.75, -0.02, 0], [-1.75, -0.78, 0], C.cyan, 2.5, 0.10);
    const a2 = makeArrow([1.75, -0.02, 0], [1.75, -0.78, 0], C.amber, 2.5, 0.10);

    const s1 = boxOutline([-1.75, -1.35, 0], 3.05, 0.96, C.muted, 2.2, 0.14, 0.92); s1.setFill(C.card, 0.95);
    const s1t = T('OFF  →  0', 21, C.muted, true, true); s1t.moveTo([-1.75, -1.35, 0]);
    swOneCardPos = [1.75, -1.35, 0]; swOneCardW = 3.05; swOneCardH = 0.96;
    const s2 = boxOutline(swOneCardPos, swOneCardW, swOneCardH, C.amber, 2.5, 0.14, 0.92); s2.setFill(C.card, 0.95);
    const s2t = T('ON   →  1', 21, C.amber, true, true); s2t.moveTo(swOneCardPos);

    const a3 = makeArrow([-1.75, -1.92, 0], [-0.80, -2.65, 0], C.muted, 2.5, 0.10);
    const a4 = makeArrow([1.75, -1.92, 0], [0.80, -2.65, 0], C.amber, 2.5, 0.10);

    const calc = boxOutline([0, -3.45, 0], 6.40, 1.45, C.cyan, 2.5, 0.18, 0.92); calc.setFill(C.card, 0.95);
    const calcH = T('Rent Calculator', 20, C.cyan, false, true); calcH.moveTo([0, -3.05, 0]);
    const calcF = T('$970 + $100x + $60(s)', 18, C.ink, true); calcF.moveTo([0, -3.72, 0]);
    b38Objs.push(g1, g1c, g1t, g2, g2c, g2t, a1, a2, s1, s1t, s2, s2t, a3, a4, calc, calcH, calcF);
  }

  await until(S(38));
  await play(
    ...act2to4All.map(o => new M.FadeOut(o, { runTime: 0.6 })),
    ...miniC.sw.fadeOut(0.6),
    ...miniS.sw.fadeOut(0.6),
    ...hideBox(),
    ...b38Objs.map(o => new M.FadeIn(o, { runTime: 0.9 })),
    ...say('NAMED GROUP → 0-OR-1 NUMBER', C.cyan)
  );

  // Beat 39: The one on the switch only marks membership in a group.
  const memHi = boxOutline(swOneCardPos, swOneCardW + 0.18, swOneCardH + 0.18, C.green, 3, 0.18, 0.08);
  const memTag = pill('1 = IN THIS GROUP (YES)', C.green, P ? 16 : 17);
  memTag.moveTo(P ? [0, -4.78, 0] : [-0.55, -2.18, 0]);

  await until(S(39));
  await play(
    new M.Create(memHi, { runTime: 0.75 }),
    new M.FadeIn(memTag, { runTime: 0.8 }),
    ...say('1 ONLY MARKS GROUP MEMBERSHIP', C.green)
  );

  // Beat 40: Numbering more neighborhoods in a row would force an equal rent gap between each pair of neighbors.
  const trapObjs = [];
  const tBaseY = P ? -3.65 : -2.15;
  const tXs = P ? [-2.25, 0, 2.25] : [-3.35, 0, 3.35];
  const tBW = P ? 1.50 : 1.95;
  const tHs = P ? [1.55, 2.75, 3.95] : [1.15, 2.05, 2.95];
  const tNames = ['1: Cedar', '2: Station', '3: Park'];
  const tCols = [C.cyan, C.amber, C.pink];

  const tFloor = new M.Line({ start: [tXs[0] - tBW * 0.75, tBaseY, 0], end: [tXs[2] + tBW * 0.75, tBaseY, 0], color: C.muted, strokeWidth: 2.5 });
  trapObjs.push(tFloor);

  for (let k = 0; k < 3; k++) {
    const h = tHs[k];
    const bar = new M.Rectangle({ width: tBW, height: h, color: tCols[k], strokeWidth: 2.5 });
    bar.setFill(tCols[k], k === 2 ? 0.25 : 0.20);
    bar.moveTo([tXs[k], tBaseY + h / 2, 0]);
    const num = T(String(k + 1), P ? 26 : 28, tCols[k], true, true);
    num.moveTo([tXs[k], tBaseY + h / 2, 0]);
    const lb = T(tNames[k], P ? 15 : 17, tCols[k], false, true);
    lb.moveTo([tXs[k], tBaseY - 0.36, 0]);
    trapObjs.push(bar, num, lb);
  }
  // Equal step guides between 1->2 and 2->3
  const g12 = new M.DashedLine({ start: [tXs[0] + tBW / 2, tBaseY + tHs[0], 0], end: [tXs[1] - tBW / 2, tBaseY + tHs[0], 0], color: C.amber });
  const a12 = makeArrow([tXs[1] - tBW / 2 - 0.16, tBaseY + tHs[0], 0], [tXs[1] - tBW / 2 - 0.16, tBaseY + tHs[1], 0], C.amber, 2.8, 0.10);
  const l12 = T('+$60', P ? 15 : 16, C.amber, true, true);
  l12.moveTo([(tXs[0] + tXs[1]) / 2 - 0.12, tBaseY + (tHs[0] + tHs[1]) / 2, 0]);

  const g23 = new M.DashedLine({ start: [tXs[1] + tBW / 2, tBaseY + tHs[1], 0], end: [tXs[2] - tBW / 2, tBaseY + tHs[1], 0], color: C.pink });
  const a23 = makeArrow([tXs[2] - tBW / 2 - 0.16, tBaseY + tHs[1], 0], [tXs[2] - tBW / 2 - 0.16, tBaseY + tHs[2], 0], C.pink, 3.2, 0.11);
  const l23 = T('+$60?', P ? 15 : 17, C.pink, true, true);
  l23.moveTo([(tXs[1] + tXs[2]) / 2 - 0.12, tBaseY + (tHs[1] + tHs[2]) / 2, 0]);
  const trapBadge = pill('FORCES EQUAL STEPS!', C.pink, P ? 15 : 16);
  trapBadge.moveTo([P ? 0 : -1.85, P ? -4.75 : 0.85, 0]);
  trapObjs.push(g12, a12, l12, g23, a23, l23, trapBadge);

  await until(S(40));
  await play(
    ...b38Objs.map(o => new M.FadeOut(o, { runTime: 0.6 })),
    new M.FadeOut(memHi, { runTime: 0.6 }),
    new M.FadeOut(memTag, { runTime: 0.6 }),
    ...trapObjs.map(o => new M.FadeIn(o, { runTime: 0.9 })),
    ...say('TRAP: 1, 2, 3 FORCES EQUAL GAPS', C.pink)
  );

  // Beat 41: An indicator uses a zero-or-one switch to apply a group difference from a reference.
  const recapObjs = [];
  if (!P) {
    const rW = 3.65, rH = 2.65, rY = -0.45;
    const rcL = boxOutline([-3.45, rY, 0], rW, rH, C.cyan, 2.8, 0.18, 0.92); rcL.setFill(C.card, 0.95);
    const rcLc = cueMark('cedar', [-4.65, rY + 0.85, 0], 0.12);
    const rcLt = T('Cedar', 24, C.cyan, false, true); rcLt.moveTo([-3.75, rY + 0.85, 0]);
    const rcLsub = T('Reference · OFF', 16, C.muted); rcLsub.moveTo([-3.45, rY + 0.25, 0]);
    const rcLv = T('0', 44, C.cyan, true, true); rcLv.moveTo([-3.45, rY - 0.42, 0]);
    const rcLp = T('$970', 22, C.ink, true); rcLp.moveTo([-3.45, rY - 1.00, 0]);

    const rcR = boxOutline([3.45, rY, 0], rW, rH, C.amber, 2.8, 0.18, 0.92); rcR.setFill(C.card, 0.95);
    const rcRc = cueMark('station', [2.25, rY + 0.85, 0], 0.12);
    const rcRt = T('Station', 24, C.amber, false, true); rcRt.moveTo([3.28, rY + 0.85, 0]);
    const rcRsub = T('Indicator · ON', 16, C.muted); rcRsub.moveTo([3.45, rY + 0.25, 0]);
    const rcRv = T('1', 44, C.amber, true, true); rcRv.moveTo([3.45, rY - 0.42, 0]);
    const rcRp = T('$1,030', 22, C.ink, true); rcRp.moveTo([3.45, rY - 1.00, 0]);

    const rArr = makeArrow([-1.40, rY, 0], [1.40, rY, 0], C.green, 3.5, 0.14);
    const rGap = T('+$60', 28, C.green, true, true); rGap.moveTo([0, rY + 0.44, 0]);
    const rGapSub = T('group difference', 15, C.muted); rGapSub.moveTo([0, rY - 0.36, 0]);
    recapObjs.push(rcL, rcLc, rcLt, rcLsub, rcLv, rcLp, rcR, rcRc, rcRt, rcRsub, rcRv, rcRp, rArr, rGap, rGapSub);
  } else {
    const rW = 5.6, rH = 1.90;
    const yTop = -0.10, yBot = -3.60;
    const rcT = boxOutline([0, yTop, 0], rW, rH, C.cyan, 2.8, 0.18, 0.92); rcT.setFill(C.card, 0.95);
    const rcTc = cueMark('cedar', [-2.25, yTop + 0.45, 0], 0.12);
    const rcTt = T('Cedar · Reference', 21, C.cyan, false, true); rcTt.moveTo([0.05, yTop + 0.45, 0]);
    const rcTv = T('OFF  →  0     $970', 22, C.ink, true, true); rcTv.moveTo([0, yTop - 0.35, 0]);

    const rArr = makeArrow([0, yTop - rH / 2 - 0.12, 0], [0, yBot + rH / 2 + 0.12, 0], C.green, 3.5, 0.14);
    const rGap = T('+$60  group difference', 19, C.green, true, true); rGap.moveTo([0, (yTop + yBot) / 2, 0]);
    // Offset label cleanly to right of vertical arrow
    rGap.moveTo([1.85, (yTop + yBot) / 2, 0]);
    const rGapShort = T('+$60', 24, C.green, true, true); rGapShort.moveTo([-0.85, (yTop + yBot) / 2, 0]);

    const rcB = boxOutline([0, yBot, 0], rW, rH, C.amber, 2.8, 0.18, 0.92); rcB.setFill(C.card, 0.95);
    const rcBc = cueMark('station', [-2.25, yBot + 0.45, 0], 0.12);
    const rcBt = T('Station · Indicator', 21, C.amber, false, true); rcBt.moveTo([0.10, yBot + 0.45, 0]);
    const rcBv = T('ON   →  1    $1,030', 22, C.ink, true, true); rcBv.moveTo([0, yBot - 0.35, 0]);
    const rGapSub = T('group gap', 16, C.muted); rGapSub.moveTo([1.15, (yTop + yBot) / 2, 0]);
    recapObjs.push(rcT, rcTc, rcTt, rcTv, rArr, rGapShort, rGapSub, rcB, rcBc, rcBt, rcBv);
  }

  await until(S(41));
  await play(
    ...trapObjs.map(o => new M.FadeOut(o, { runTime: 0.6 })),
    ...recapObjs.map(o => new M.FadeIn(o, { runTime: 1.0 })),
    ...say('0/1 SWITCH = GROUP GAP FROM REFERENCE', C.green)
  );
}

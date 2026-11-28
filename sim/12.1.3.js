// 12.1.3 Try it: move a help request across the renewal-day cutoff.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = { name: 'Bea', hours: 2, help: 1, months: 3, requestDay: 10, cancelDay: 11 };
  const renewal = Date.UTC(2025, 2, 1);
  const dayMs = 86400000;
  const dateFormat = new Intl.DateTimeFormat('en-GB', {
    month: 'short', day: 'numeric', timeZone: 'UTC'
  });
  const date = day => dateFormat.format(renewal + day * dayMs);

  let data = { ...START };
  let random = false;
  const svg = s('svg', {
    viewBox: '0 0 420 222',
    role: 'img',
    'aria-label': 'Renewal timeline'
  });
  const box = h('div');
  const note = h('div', { class: 'sim-note', 'aria-live': 'polite' });
  const challengePanel = h('div');
  const dayLabel = h('span');
  const slider = h('input', {
    type: 'range', min: -30, max: 30, step: 1,
    'aria-label': 'Date of the extra help request',
    style: { width: '100%', minHeight: '44px', accentColor: C.violet },
    oninput: e => {
      data.requestDay = Number(e.target.value);
      draw();
    }
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: prediction time'),
    h('p', { class: 'sub' },
      'Move the extra help request. Watch which requests the app could count when the plan renewed on 1 March.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('label', { style: { display: 'block', marginTop: '.65rem' } }, dayLabel, slider),
        h('div', { class: 'sim-row' },
          btn('New data', newData, 'go'),
          btn('Back to Bea', () => {
            data = { ...START };
            random = false;
            draw();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengePanel)))));

  const challenge = challenges(challengePanel, [
    {
      text: 'With Bea’s data, move the extra request into February so her card shows 2 requests.',
      check: st => !st.random && st.day >= -28 && st.day < 0 && st.help === 2,
      why: 'Both help requests were known by the end of 28 February, so both count.'
    },
    {
      text: 'Put Bea’s extra request on 1 March and check her help count.',
      check: st => !st.random && st.day === 0 && st.help === 1,
      why: 'The card uses complete days through 28 February, so the request on renewal day stays off it.'
    },
    {
      text: 'Press New data, then move the extra help request after 1 March.',
      check: st => st.random && st.day > 0 && st.help === st.otherHelp,
      why: 'A request after renewal changes neither the frozen help count nor what the customer did later.'
    }
  ]);

  // The kit changes the active challenge when a navigation button is clicked.
  challengePanel.addEventListener('click', updateChallenge);

  function newData() {
    const hours = rnd(0, 24);
    data = {
      name: 'New customer',
      hours: hours === data.hours ? (hours + 1) % 25 : hours,
      help: rnd(0, 4),
      months: rnd(1, 12),
      requestDay: rnd(-30, -1),
      cancelDay: rnd(0, 1) ? rnd(1, 30) : null
    };
    random = true;
    draw();
  }

  const counted = () => data.requestDay < 0;
  const helpCount = () => data.help + Number(counted());
  const noun = count => count === 1 ? 'request' : 'requests';

  function updateChallenge() {
    challenge.update({
      random,
      day: data.requestDay,
      help: helpCount(),
      otherHelp: data.help
    });
  }

  const x = day => 28 + (day + 30) * (364 / 60);
  const axisY = 148;

  function label(content, px, y, color = C.ink, size = 17, anchor = 'middle') {
    return s('text', {
      x: px, y, fill: color, 'font-size': size, 'text-anchor': anchor,
      'font-family': 'Segoe UI, Arial, sans-serif'
    }, content);
  }

  function line(x1, y1, x2, y2, color, width = 2, dash = null) {
    return s('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': width, 'stroke-dasharray': dash });
  }

  function draw() {
    const day = data.requestDay;
    const help = helpCount();
    const cancelDay = data.cancelDay;
    const hasOutcome = cancelDay !== null;
    const requestColor = counted() ? C.cyan : C.violet;
    const px = x(day);
    const nodes = [
      s('rect', { x: 12, y: 46, width: x(0) - 12, height: 112, rx: 8, fill: C.cyan, 'fill-opacity': 0.07 }),
      s('rect', { x: x(0), y: 46, width: 408 - x(0), height: 112, rx: 8, fill: C.violet, 'fill-opacity': 0.07 }),
      label('Known before renewal', 105, 28, C.cyan),
      label('After renewal', 315, 28, C.violet),
      line(x(-30), axisY, x(30), axisY, C.muted),
      line(x(0), 47, x(0), 166, C.amber, 3),
      line(px, 92, px, axisY, requestColor, 2, '4 4'),
      s('circle', { cx: px, cy: 92, r: 8, fill: requestColor, stroke: C.bg, 'stroke-width': 2 }),
      label(`Help · ${date(day)}`, Math.max(68, Math.min(352, px)), 75, requestColor),
      label('30 Jan', x(-30), 180, C.ink, 16, 'start'),
      label('1 Mar · renewal day', x(0), 197, C.amber, 16),
      label('31 Mar', x(30), 180, C.ink, 16, 'end')
    ];

    if (hasOutcome) {
      const cx = x(cancelDay);
      nodes.push(
        line(cx, 127, cx, axisY, C.pink, 2, '4 4'),
        s('circle', { cx, cy: 127, r: 7, fill: C.pink, stroke: C.bg, 'stroke-width': 2 }),
        label(`Cancelled · ${date(cancelDay)}`, Math.min(343, Math.max(275, cx)), 114, C.pink, 15)
      );
    }

    svg.replaceChildren(...nodes);
    svg.setAttribute('aria-label',
      `Extra request on ${date(day)}. Renewal on 1 March. ${hasOutcome ? `Cancelled on ${date(cancelDay)}.` : 'Stayed through 31 March.'}`);
    slider.value = String(day);
    slider.setAttribute('aria-valuetext', date(day));
    dayLabel.textContent = `Extra help request · ${date(day)}`;

    fbox(box, [
      [`${data.name} · 1 Mar`, C.amber],
      ['Features · 30 Jan–28 Feb', C.cyan],
      `${data.hours} ${data.hours === 1 ? 'hour' : 'hours'} played`,
      `${help} help ${noun(help)} (${data.help} + ${Number(counted())})`,
      `${data.months} ${data.months === 1 ? 'month' : 'months'} as a member`,
      ['Label · cancelled in the next 30 days?', C.violet],
      [hasOutcome ? `Yes · ${date(cancelDay)}` : 'No · stayed through 31 Mar', hasOutcome ? C.pink : C.cyan]
    ]);

    note.textContent = counted()
      ? 'The extra request falls within the 30 days before renewal, so it counts.'
      : 'The help count freezes at the end of 28 February, so the extra request stays off the card.';
    updateChallenge();
  }

  draw();
  return () => challengePanel.removeEventListener('click', updateChallenge);
}

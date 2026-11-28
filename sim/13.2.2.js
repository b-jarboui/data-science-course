// 13.2.2 Try it: change the repayment mix and draw cards from it.
export default function mount(root, kit) {
  const { h, C, btn, fbox, rnd, challenges } = kit;
  const START = [true, true, true, true, false, false, false, false];
  const outcomes = START.slice();
  const draws = { full: 0, total: 0 };
  let lastDraw = null;
  let drewBatch = false;

  const cardGrid = h('div', {
    role: 'group',
    'aria-label': 'Application cards',
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
      gap: '.4rem',
    },
  });
  const cards = outcomes.map((_, i) => {
    const card = btn('', () => {
      outcomes[i] = !outcomes[i];
      changed();
    });
    Object.assign(card.style, {
      minWidth: '0',
      padding: '.35rem .05rem',
      minHeight: '56px',
      lineHeight: '1.15',
      fontSize: 'clamp(.72rem, 2.5vw, .92rem)',
    });
    cardGrid.append(card);
    return card;
  });

  const drawNote = h('div', { class: 'sim-note', role: 'status' });
  const bar = h('div', {
    role: 'img',
    'aria-label': 'Draw results',
    style: {
      display: 'none',
      height: '1.1rem',
      overflow: 'hidden',
      borderRadius: '.4rem',
      border: `1px solid ${C.line}`,
      marginTop: '.6rem',
    },
  });
  const fullBar = h('div', { style: { background: C.cyan } });
  const partialBar = h('div', { style: { background: C.pink } });
  bar.append(fullBar, partialBar);
  const box = h('div', { 'aria-live': 'polite' });
  const challengePanel = h('div');

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: how mixed are the cards?'),
    h('p', { class: 'sub' }, 'Tap a card to switch between full and partial repayment. Each draw puts the card back.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, cardGrid,
        h('div', { class: 'sim-row' },
          btn('Draw one', () => drawCards(1)),
          btn('Draw 200', () => drawCards(200), 'go'),
          btn('New data', () => {
            outcomes.forEach((_, i) => { outcomes[i] = rnd(0, 1) === 1; });
            changed();
          }),
          btn('Reset', () => {
            outcomes.splice(0, outcomes.length, ...START);
            changed();
          })),
        drawNote, bar),
      h('div', {},
        h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, challengePanel)))));

  const goals = challenges(challengePanel, [
    {
      text: 'Make six cards show full repayment. Which outcome is more likely?',
      check: state => state.full === 6,
      why: 'Full repayment is more likely because six of the eight cards show it.',
    },
    {
      text: 'Make entropy zero using only partial repayments.',
      check: state => state.full === 0,
      why: 'Every card shows partial repayment, so a draw brings zero surprise.',
    },
    {
      text: 'Make both outcomes equally likely, then press “Draw 200”.',
      check: state => state.full * 2 === outcomes.length && state.drewBatch,
      why: 'The two outcomes have the same chance on every draw, even when the two draw counts differ.',
    },
  ]);

  function contribution(probability) {
    return probability === 0 || probability === 1 ? 0 : -probability * Math.log2(probability);
  }

  function bits(value) {
    return value.toFixed(3).replace(/\.?0+$/, '');
  }

  function changed() {
    draws.full = 0;
    draws.total = 0;
    lastDraw = null;
    drewBatch = false;
    render();
  }

  function drawCards(count) {
    for (let i = 0; i < count; i++) {
      lastDraw = rnd(0, outcomes.length - 1);
      if (outcomes[lastDraw]) draws.full++;
    }
    draws.total += count;
    if (count === 200) drewBatch = true;
    render();
  }

  function render() {
    const n = outcomes.length;
    const full = outcomes.filter(Boolean).length;
    const partial = n - full;
    const fullShare = full / n;
    const partialShare = partial / n;
    const fullBits = contribution(fullShare);
    const partialBits = contribution(partialShare);

    cards.forEach((card, i) => {
      const kind = outcomes[i] ? 'Full' : 'Partial';
      card.replaceChildren(h('div', { style: { fontWeight: '700' } }, String(i + 1)), kind);
      card.setAttribute('aria-label', `Application ${i + 1}, ${kind.toLowerCase()} repayment. Press to switch.`);
      card.style.borderColor = outcomes[i] ? C.cyan : C.pink;
      card.style.color = outcomes[i] ? C.cyan : C.pink;
      card.style.background = outcomes[i] ? '#14323f' : '#36213e';
      card.style.boxShadow = lastDraw === i ? `inset 0 0 0 2px ${C.amber}` : '';
    });

    const observedPartial = draws.total - draws.full;
    bar.style.display = draws.total ? 'flex' : 'none';
    if (draws.total) {
      const fullPercent = 100 * draws.full / draws.total;
      fullBar.style.width = `${fullPercent}%`;
      partialBar.style.width = `${100 - fullPercent}%`;
      bar.setAttribute('aria-label', `Draw results: ${draws.full} full, ${observedPartial} partial`);
      drawNote.textContent = `${draws.total} draws · ${draws.full} full · ${observedPartial} partial. Last card: ${lastDraw + 1}.`;
    } else {
      drawNote.textContent = 'Draw cards to see how often each outcome appears.';
    }

    const total = fullBits + partialBits;
    fbox(box, [
      [`Full probability = ${full}/${n} = ${fullShare}`, C.cyan],
      [`Partial probability = ${partial}/${n} = ${partialShare}`, C.pink],
      'Add the two shares of surprise:',
      [`Entropy ${total === 0 || total === 1 ? '=' : '≈'} ${bits(fullBits)} + ${bits(partialBits)} = ${bits(total)} ${total === 1 ? 'bit' : 'bits'}`, C.amber],
    ]);
    goals.update({ full, drewBatch });
  }

  render();
}

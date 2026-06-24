const COLORS = ['#001D39', '#49769F', '#7BBDE8', '#4E8EA2', '#6EA2B3', '#BDD8E9', '#F0D49B'];

export function fireConfetti() {
  const wrap = document.createElement('div');
  Object.assign(wrap.style, {
    position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '9999', overflow: 'hidden',
  });
  document.body.appendChild(wrap);

  for (let i = 0; i < 72; i++) {
    const el = document.createElement('span');
    const color = COLORS[i % COLORS.length];
    const left   = 5 + Math.random() * 90;
    const delay  = Math.random() * 450;
    const dur    = 850 + Math.random() * 700;
    const w      = 6 + Math.random() * 7;
    const h      = w * (0.45 + Math.random() * 0.3);
    const r0     = Math.random() * 360;
    const r1     = r0 + (Math.random() > .5 ? 1 : -1) * (200 + Math.random() * 400);

    Object.assign(el.style, {
      position: 'absolute', left: `${left}%`, top: '-14px',
      width: `${w}px`, height: `${h}px`,
      background: color, borderRadius: '2px', opacity: '0',
    });
    wrap.appendChild(el);

    el.animate(
      [
        { transform: `translateY(0) rotate(${r0}deg)`,      opacity: 1 },
        { transform: `translateY(108vh) rotate(${r1}deg)`,  opacity: 0 },
      ],
      { duration: dur, delay, fill: 'forwards', easing: 'ease-in' },
    );
  }

  setTimeout(() => wrap.remove(), 2200);
}

// Phase 9 — shared animation presets. Every animation in the app imports
// from here so timing stays consistent. Rule: animate state/feedback only,
// never pure decoration.

export const d = {
  fast:  0.10,  // icon swaps, press feedback
  base:  0.18,  // most hover + state transitions
  enter: 0.22,  // panel / card entrances
  slow:  0.30,  // page fades, large layout shifts
};

export const ease = {
  out:     [0, 0, 0.2, 1],
  outBack: [0.34, 1.56, 0.64, 1],  // subtle elastic overshoot
  spring:  { type: 'spring', stiffness: 380, damping: 30, mass: 0.8 },
};

// Spread these directly onto motion elements: <motion.div {...fadeUp}>
export const fadeUp = {
  initial:    { opacity: 0, y: 6 },
  animate:    { opacity: 1, y: 0 },
  exit:       { opacity: 0, y: -4 },
  transition: { duration: d.enter, ease: ease.out },
};

export const fadeIn = {
  initial:    { opacity: 0 },
  animate:    { opacity: 1 },
  exit:       { opacity: 0 },
  transition: { duration: d.base, ease: ease.out },
};

export const scaleIn = {
  initial:    { opacity: 0, scale: 0.96, y: 4 },
  animate:    { opacity: 1, scale: 1,    y: 0 },
  exit:       { opacity: 0, scale: 0.97, y: 2 },
  transition: { duration: d.enter, ease: ease.out },
};

export const slideRight = {
  initial:    { opacity: 0, x: 20 },
  animate:    { opacity: 1, x: 0  },
  exit:       { opacity: 0, x: 14 },
  transition: { duration: d.enter, ease: ease.out },
};

// Use as `variants` on a container so children stagger automatically.
// Children must have `variants={{ hidden, show }}` to respond.
export const staggerContainer = (delay = 0.05) => ({
  hidden: {},
  show:   { transition: { staggerChildren: delay } },
});

export const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: d.enter, ease: ease.out } },
};

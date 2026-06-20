/* =====================================================================
   PERSONA CONFIG — Elders ("ElderScroll")
   Gesture sensitivity and pacing — i.e. how the gestures FEEL: how
   easily a clap/lean registers, and how patient the app is before it
   offers help. Tune these per audience (e.g. gentler thresholds and a
   sooner help hint for older users; snappier for teens).

   Loaded as a plain <script> BEFORE app.js, so `CONFIG` is a shared
   global. To make a new persona, copy this file and adjust the numbers.
   ===================================================================== */
const CONFIG = {
  /* Clap detection */
  clapApart:    0.9,   // wrists must first separate to ~shoulder width
  clapTogether: 0.45,  // ...then come closer than this (× shoulder width) = a clap
  clapCooldown: 1200,  // ms between claps; stops one clap firing twice

  /* Lean detection */
  leanEnter:     0.45, // shoulder-centre shift (× shoulder width) to count as a lean
  leanExit:      0.20, // must return inside this before another lean can fire
  leanRightSign: -1,   // camera orientation: user's RIGHT = shoulder-centre x DECREASES.
                       //   If lean reads reversed on a machine, change -1 to 1.

  /* Pacing / timing (milliseconds) */
  placeholderMs: 4000,  // how long a missing-video placeholder shows before auto-advancing
  maxStepMs:     30000, // safety cap per tutorial step (videos are < 30s)
  confettiMs:    3000,  // success-screen confetti duration
  helpDelayMs:   12000, // show the "it's not working..." hint after this long with no success
};

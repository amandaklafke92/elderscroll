/* =====================================================================
   PERSONA CONFIG — Elders ("ElderScroll")
   Gesture sensitivity and pacing — i.e. how the gestures FEEL: how
   easily a clap/lean registers, and how patient/quick the app is. Tune
   these per audience (e.g. gentler thresholds for older users).

   Loaded as a plain <script> BEFORE app.js, so `CONFIG` is a shared
   global. To make a new persona, copy this file and adjust the numbers.
   ===================================================================== */
const CONFIG = {
  /* Clap detection — tightened so a lean (or resting hands) doesn't read
     as a clap: hands must spread WIDER first, then come CLOSER together. */
  clapApart:    1.1,   // wrists must first separate past ~1.1× shoulder width
  clapTogether: 0.35,  // ...then come closer than this (× shoulder width) = a clap
  clapCooldown: 1500,  // ms between claps; stops one clap firing twice

  /* Lean detection */
  leanEnter:     0.45, // shoulder-centre shift (× shoulder width) to count as a lean
  leanExit:      0.20, // must return inside this before another lean can fire
  leanRightSign: -1,   // camera orientation: user's RIGHT = shoulder-centre x DECREASES.
                       //   If lean reads reversed on a machine, change -1 to 1.

  /* Teach-sequence pacing (milliseconds) — the passive intro screens. */
  introMs:         5000, // how long the "CLAP = CLICK" intro screen shows
  countdownFrom:   3,    // counts 3 → 2 → 1 before the video
  countdownStepMs: 800,  // time on each countdown number
  readyMs:         3500, // how long the "YOUR TURN" screen shows before practice

  /* Other pacing (milliseconds) */
  placeholderMs: 4000,  // how long a missing-video placeholder shows before auto-advancing
  maxStepMs:     30000, // safety cap on the tutorial video (videos are < 30s)
  confettiMs:    3000,  // success-screen confetti duration
  helpDelayMs:   12000, // show the help hint after this long with no success
};

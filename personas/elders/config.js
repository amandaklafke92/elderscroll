/* =====================================================================
   PERSONA CONFIG — Elders ("ElderScroll")
   Gesture sensitivity and pacing — i.e. how the gestures FEEL: how
   easily a movement registers, and how patient the app is before it
   offers help. Tune these per audience (e.g. gentler thresholds and a
   sooner help hint for older users; snappier for teens).

   Loaded as a plain <script> BEFORE app.js, so `CONFIG` is a shared
   global. To make a new persona, copy this file and adjust the numbers.
   ===================================================================== */
const CONFIG = {
  /* --- Legacy detectors kept for compatibility (no current lesson uses them) --- */
  clapApart:    0.9,
  clapTogether: 0.45,
  clapCooldown: 1200,
  leanEnter:     0.45,
  leanExit:      0.20,
  leanRightSign: -1,

  /* --- New gesture thresholds ---
     All ratios are × shoulder width unless noted. Tune by pressing `d`
     during practice to watch the live numbers, then dial these in. */

  /* Click = cross-body tap.  Distance from one wrist to the opposite
     shoulder must drop below this fraction of the shoulder width.
     Lower = the hand must get closer to the shoulder before it counts.
     Watching live values via `d` is the fastest way to dial this in:
     during a real tap the dist usually lands ~0.3–0.6 depending on
     camera angle and how tightly the fingers reach the shoulder. */
  crossTapDist:    0.7,

  /* Move = bilateral push forward. Two-stage detector:
       (1) ARM  — both wrists pulled back near the body. Triggers when
                  wrist.z is ABOVE pushBackZ (z near 0 = wrists at the
                  body's depth plane; positive = slightly behind it).
       (2) FIRE — both wrists thrust forward. Triggers when wrist.z
                  is BELOW pushForwardZ (the more negative, the further
                  out the arms must reach).
     The arming step is what stops the gesture firing on a partial push.
     Tune `pushBackZ` upward if it's hard to arm; tune `pushForwardZ`
     more negative if it still fires before the full extension. */
  pushBackZ:        0.0,
  pushForwardZ:    -0.55,

  /* Zoom In = one arm straight up. A wrist must rise above the nose by
     at least this much (normalized image y units). Larger = the hand
     must be clearly above the head, not just nose-height. */
  reachUpMargin:   0.20,

  /* Zoom Out = hands together at chest → arms wide. Detector arms when
     wrists are close (< near × shoulderWidth) at chest level, fires
     when they later spread past (> far × shoulderWidth).
     Tighter near + larger far = the opening must be more pronounced. */
  openOutNearRatio: 0.50,
  openOutFarRatio:  3.1,

  /* Take a Photo = torso rotation. When current shoulder width falls
     below this fraction of the rolling-baseline (facing-forward) width,
     the user is considered rotated. Lower = needs a fuller turn. */
  rotateRatio:     0.42,

  /* Number of consecutive frames a detector must see its "fire" condition
     before triggering. Higher = the user must hold the pose briefly,
     which kills most false positives from a quick passing motion.
     `crossTapHoldFrames` overrides this for the Click tap (kept low so
     a quick tap still counts). */
  gestureHoldFrames:  6,
  crossTapHoldFrames: 3,

  /* Shared cooldown between gesture fires (ms). */
  gestureCooldown: 1700,

  /* --- Pacing / timing (milliseconds) --- */
  placeholderMs: 4000,   // how long a missing-video placeholder shows before auto-advancing
  maxStepMs:     45000,  // safety cap per tutorial/intro step
  confettiMs:    3000,   // success-screen confetti duration
  helpDelayMs:   12000,  // show the "it's not working..." hint after this long
  failureMs:     20000,  // time without detection on a practice screen → failure feedback
  failureShowMs: 2500,   // how long the failure feedback stays before retry

  /* Recording window for Practice 2.  Get-ready countdown gives the
     "3 seconds BEFORE Practice 2 appears" portion of the clip; the
     post-capture window gives the "3 seconds AFTER the gesture" portion. */
  getReadyMs:     3000,
  postCaptureMs:  3000,

  /* Final reel + Lovable handoff. The passcode remains in the local helper,
     never in browser-delivered code. */
  uploadEndpoint: 'http://localhost:8787/upload',
  videoLibraryUrl: 'https://claude-vid-spot.lovable.app',
  recordBackground: 'assets/background-beat-it.jpeg',
};

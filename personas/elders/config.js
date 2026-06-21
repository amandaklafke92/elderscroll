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

  /* Move = bilateral push forward. Both wrists' z (depth) must drop
     below this (more negative = closer to camera) AND sit near
     shoulder height.  More negative = arms must be pushed further out. */
  pushForwardZ:    -0.40,

  /* Zoom In = BOTH arms straight up. Each wrist must rise above the
     nose by at least this much (normalized image y units) OR go off
     the top of the camera frame. Lower = easier to register, but more
     likely to fire on a partial raise. Wrists that exit the frame are
     always counted as "up" so a full extension does not get penalised
     by MediaPipe losing them at the top edge. */
  reachUpMargin:   0.03,

  /* Zoom Out = hands together at chest → arms wide. Detector arms when
     wrists are close (< near × shoulderWidth) at chest level, fires
     when they later spread past (> far × shoulderWidth).
     Tighter near + larger far = the opening must be more pronounced. */
  openOutNearRatio: 0.70,
  openOutFarRatio:  2.2,

  /* Take a Photo = T-pose ("cristo"): both arms extended laterally at
     shoulder height.
     - tPoseHeightTol: max |wrist.y - shoulder.y| (image y units). Lower
       = stricter requirement that the arms are truly horizontal.
     - tPoseWidthRatio: min (wrist-to-wrist span / shoulder width). At
       rest with arms down this is ~0.5; with arms fully out it climbs
       to 2.5–3+. Higher = arms must be fully extended out. */
  tPoseHeightTol:  0.15,
  tPoseWidthRatio: 2.0,

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
  failureShowMs: 5500,   // how long the failure feedback stays before retry

  getReadyMs: 3000,
  giftMs:     3500,

  /* Camera-display zoom level set by the Zoom In gesture. Applied as a
     CSS `transform: scale()` on #camera-display only — the detection
     feed (#camera) is never scaled. Zoom Out resets to 1.0. */
  displayZoomLevel: 1.4,

  /* How long the practice screen holds AFTER a successful gesture so the
     user can see the visual effect (zoom, photo freeze-frame, highlight
     migration), before transitioning to the success screen. Aligned with
     the Practice-2 post-capture window so the recording stops at the same
     moment the success screen appears. */
  effectHoldMs: 3000,

  /* Final reel + Lovable handoff. The passcode remains in the local helper,
     never in browser-delivered code. */
  uploadEndpoint: 'http://localhost:8787/upload',
  videoLibraryUrl: 'https://claude-vid-spot.lovable.app',
  recordBackground: 'assets/background-beat-it.jpeg',

  /* Final 16-second reveal. Times are the matching timestamps in the
     source track; the renderer divides each window evenly by `repeat`
     and replays the participant's matching Practice 2 movement. */
  reelMusic: 'assets/music_Michael-Jackson_Beat-It.mp3',
  reelSequence: [
    { lessonId: 'click',      repeat: 8, start: 3 * 60 + 30, end: 3 * 60 + 33 },
    { lessonId: 'zoom-in',    repeat: 2, start: 3 * 60 + 33, end: 3 * 60 + 35 },
    { lessonId: 'move',       repeat: 2, start: 3 * 60 + 35, end: 3 * 60 + 36 },
    { lessonId: 'take-photo', repeat: 1, start: 3 * 60 + 36, end: 3 * 60 + 40 },
    { lessonId: 'zoom-out',   repeat: 2, start: 3 * 60 + 40, end: 3 * 60 + 46 },
  ],
};

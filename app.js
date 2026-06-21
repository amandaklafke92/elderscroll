/* =====================================================================
   ElderScroll — gesture-driven onboarding flow
   Pure static app: HTML + CSS + this file. MediaPipe loaded from a CDN.

   Lessons are sequential: intro video → for each lesson in
   CONTENT.lessons → tutorial → practice 1 → get-ready (3s) →
   practice 2 (silently recorded) → success → next lesson.  The lesson
   list and the gesture each lesson expects live in personas/<persona>/
   content.js; this engine reads from `CONTENT` and `CONFIG` globals.
   ===================================================================== */

/* ---------- Tunable constants — sourced from the persona's config.js ---------- */
const CLAP_APART       = CONFIG.clapApart;
const CLAP_TOGETHER    = CONFIG.clapTogether;
const CLAP_COOLDOWN    = CONFIG.clapCooldown;

const LEAN_ENTER       = CONFIG.leanEnter;
const LEAN_EXIT        = CONFIG.leanExit;
const LEAN_RIGHT_SIGN  = CONFIG.leanRightSign;

const CROSS_TAP_DIST   = CONFIG.crossTapDist;
const PUSH_FORWARD_Z   = CONFIG.pushForwardZ;
const PUSH_BACK_Z      = CONFIG.pushBackZ ?? 0;
const REACH_UP_MARGIN  = CONFIG.reachUpMargin;
const OPEN_NEAR        = CONFIG.openOutNearRatio;
const OPEN_FAR         = CONFIG.openOutFarRatio;
const ROTATE_RATIO     = CONFIG.rotateRatio;
const GESTURE_COOLDOWN = CONFIG.gestureCooldown;
const GESTURE_HOLD     = CONFIG.gestureHoldFrames ?? 1;
const CROSS_TAP_HOLD   = CONFIG.crossTapHoldFrames ?? GESTURE_HOLD;

const PLACEHOLDER_MS   = CONFIG.placeholderMs;
const MAX_STEP_MS      = CONFIG.maxStepMs;
const CONFETTI_MS      = CONFIG.confettiMs;
const HELP_DELAY_MS    = CONFIG.helpDelayMs;
const FAILURE_MS       = CONFIG.failureMs;
const FAILURE_SHOW_MS  = CONFIG.failureShowMs;
const GET_READY_MS     = CONFIG.getReadyMs;
const POST_CAPTURE_MS  = CONFIG.postCaptureMs;

/* ---------- MediaPipe CDN locations (verified reachable) ---------- */
const MP_BUNDLE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs';
const MP_WASM   = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
const MP_MODEL  = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const MP_SEG_MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';

/* ---------- Tiny DOM helper ---------- */
const el = (sel) => document.querySelector(sel);

/* ---------- App state ---------- */
let poseLandmarker = null;
let imageSegmenter = null;
let bgImage = null;
let bgReady = false;
let participantName = '';
let camera = null;
let lastVideoTime = -1;
let activeGestureHandler = null;   // set by practice screens; null elsewhere
let activeExpectedGesture = null;  // gestureKey expected on the current practice screen
let currentSelection = 'next';
let helpTimer = null;
let failureTimer = null;
let currentSkipAction = null;     // TESTING ONLY: presenter S key

let lessonIdx = 0;
let currentLesson = null;

const UPLOAD_ENDPOINT = CONFIG.uploadEndpoint;
const VIDEO_LIBRARY_URL = CONFIG.videoLibraryUrl;

/* =====================================================================
   1. STARTUP — camera + MediaPipe, triggered by the Start button
   ===================================================================== */
window.addEventListener('DOMContentLoaded', () => {
  camera = el('#camera');
  const startButton = el('#start-btn');
  startButton.addEventListener('click', start, { once: true });
  currentSkipAction = () => startButton.click();
  setupPresenterKeys();
  sizeConfetti();
  window.addEventListener('resize', sizeConfetti);
});

async function start() {
  const status = el('#start-status');
  try {
    status.textContent = 'Starting camera…';
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 }, audio: false
    });
    camera.srcObject = stream;
    await camera.play();

    status.textContent = 'Loading movement detection… (first time can take ~10 seconds)';
    const vision = await import(MP_BUNDLE);
    const fileset = await vision.FilesetResolver.forVisionTasks(MP_WASM);
    poseLandmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MP_MODEL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numPoses: 1
    });

    if (CONFIG.recordBackground) {
      try {
        imageSegmenter = await vision.ImageSegmenter.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MP_SEG_MODEL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          outputConfidenceMasks: true,
          outputCategoryMask: false,
        });
        loadBackground();
      } catch (err) {
        console.warn('[ElderScroll] background swap unavailable; using the real background', err);
      }
    }

    requestAnimationFrame(detectLoop);
    goState('name');
  } catch (err) {
    console.error(err);
    status.textContent = 'Could not start: ' + err.message +
      '  — make sure you allowed the camera and are on localhost.';
    el('#start-btn').classList.remove('hidden');
  }
}

/* =====================================================================
   2. DETECTION LOOP + GESTURE DETECTORS
   ===================================================================== */
function detectLoop() {
  if (poseLandmarker && camera.readyState >= 2 && camera.currentTime !== lastVideoTime) {
    lastVideoTime = camera.currentTime;
    const result = poseLandmarker.detectForVideo(camera, performance.now());
    if (result.landmarks && result.landmarks.length) {
      processGestures(result.landmarks[0]);
    }
  }
  requestAnimationFrame(detectLoop);
}

/* MediaPipe pose landmark indices we use:
     0  nose
     11 left shoulder · 12 right shoulder
     15 left wrist · 16 right wrist
   "Left"/"right" are the person's anatomical sides. */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const visible = (p) => p && (p.visibility === undefined || p.visibility > 0.5);

/* --- Legacy detectors (clap + lean) kept for compatibility -------- */
let handsApart = false;
let lastClapTime = 0;
function detectClap(lm) {
  const lw = lm[15], rw = lm[16], ls = lm[11], rs = lm[12];
  if (!visible(lw) || !visible(rw) || !visible(ls) || !visible(rs)) return false;
  const shoulderWidth = dist(ls, rs) || 0.2;
  const ratio = dist(lw, rw) / shoulderWidth;
  if (ratio > CLAP_APART) handsApart = true;
  if (handsApart && ratio < CLAP_TOGETHER) {
    const now = performance.now();
    if (now - lastClapTime > CLAP_COOLDOWN) {
      lastClapTime = now;
      handsApart = false;
      return true;
    }
  }
  return false;
}

let baselineX = null;
let leanState = 'center';
function detectLean(lm) {
  const ls = lm[11], rs = lm[12];
  if (!visible(ls) || !visible(rs)) return null;
  const cx = (ls.x + rs.x) / 2;
  const shoulderWidth = Math.abs(ls.x - rs.x) || 0.2;
  if (baselineX === null) { baselineX = cx; return null; }
  const offset = (cx - baselineX) / shoulderWidth;
  let dir = null;
  if (offset * LEAN_RIGHT_SIGN > LEAN_ENTER) dir = 'right';
  else if (offset * LEAN_RIGHT_SIGN < -LEAN_ENTER) dir = 'left';
  if (dir && leanState === 'center') { leanState = dir; return dir; }
  if (!dir && Math.abs(offset) < LEAN_EXIT) {
    leanState = 'center';
    baselineX = baselineX * 0.95 + cx * 0.05;
  }
  return null;
}

/* --- Helper: gesture must hold its "fire" condition for GESTURE_HOLD
   consecutive frames, AND the cooldown since the last fire must have
   passed.  This kills brief incidental motions while still feeling
   responsive once the user commits to a pose. */
function holdGate(state, condition, holdFrames = GESTURE_HOLD) {
  if (!condition) { state.frames = 0; return false; }
  state.frames++;
  if (state.frames < holdFrames) return false;
  const now = performance.now();
  if (now - state.last < GESTURE_COOLDOWN) return false;
  state.last = now;
  state.frames = 0;
  return true;
}

/* --- Click = cross-body tap. Either wrist meeting the OPPOSITE
   shoulder within crossTapDist × shoulder-width counts.  We score each
   arm independently so a hidden / occluded non-tapping arm doesn't
   block detection of the tapping one. */
const crossTapState = { frames: 0, last: 0 };
let lastCrossTapDist = Infinity;
function detectCrossTap(lm) {
  const ls = lm[11], rs = lm[12], lw = lm[15], rw = lm[16];
  if (!visible(ls) || !visible(rs)) return false;
  const shoulderWidth = dist(ls, rs) || 0.2;
  let best = Infinity;
  // Right hand → left shoulder
  if (visible(rw)) best = Math.min(best, dist(rw, ls) / shoulderWidth);
  // Left hand → right shoulder
  if (visible(lw)) best = Math.min(best, dist(lw, rs) / shoulderWidth);
  lastCrossTapDist = best;
  return holdGate(crossTapState, best < CROSS_TAP_DIST, CROSS_TAP_HOLD);
}

/* --- Move = bilateral push forward.
   Two-stage detector so it can't fire mid-motion:
     1. ARM  — both wrists pulled back near the body (z above PUSH_BACK_Z)
               at roughly shoulder height. Mirrors the arming pattern in
               detectOpenOut.
     2. FIRE — both wrists thrust forward (z below PUSH_FORWARD_Z), still
               near shoulder height. Hold + cooldown gate applies as usual.
   This stops the gesture triggering on a partial push or on arms that
   happen to be hanging slightly forward at rest. */
let pushArmed = false;
const pushForwardState = { frames: 0, last: 0 };
function detectPushForward(lm) {
  const ls = lm[11], rs = lm[12], lw = lm[15], rw = lm[16];
  if (!visible(ls) || !visible(rs) || !visible(lw) || !visible(rw)) return false;
  if (typeof lw.z !== 'number' || typeof rw.z !== 'number') return false;
  const wristsAtChestOrShoulder =
    Math.abs(lw.y - ls.y) < 0.40 && Math.abs(rw.y - rs.y) < 0.40;
  const wristsBack    = lw.z > PUSH_BACK_Z    && rw.z > PUSH_BACK_Z;
  const wristsForward = lw.z < PUSH_FORWARD_Z && rw.z < PUSH_FORWARD_Z;
  if (wristsBack && wristsAtChestOrShoulder) pushArmed = true;
  const fire = pushArmed && wristsForward && wristsAtChestOrShoulder;
  const triggered = holdGate(pushForwardState, fire);
  if (triggered) pushArmed = false;
  return triggered;
}

/* --- Zoom In = one arm extended overhead. Wrist above nose by margin. */
const reachUpState = { frames: 0, last: 0 };
function detectReachUp(lm) {
  const nose = lm[0], lw = lm[15], rw = lm[16];
  if (!visible(nose) || !(visible(lw) || visible(rw))) return false;
  const above =
    (visible(lw) && lw.y < nose.y - REACH_UP_MARGIN) ||
    (visible(rw) && rw.y < nose.y - REACH_UP_MARGIN);
  return holdGate(reachUpState, above);
}

/* --- Zoom Out = wrists transition from near each other at chest
   level to wide open. Mirrors the clap detector's "must arm first"
   pattern, just in reverse — and the "fire" condition still has to
   hold for a few frames, so a quick stretch on the way past doesn't
   trip it. */
let openHandsNear = false;
const openOutState = { frames: 0, last: 0 };
function detectOpenOut(lm) {
  const ls = lm[11], rs = lm[12], lw = lm[15], rw = lm[16];
  if (!visible(ls) || !visible(rs) || !visible(lw) || !visible(rw)) return false;
  const sw = dist(ls, rs) || 0.2;
  const gap = dist(lw, rw) / sw;
  const wristsAroundChest =
    Math.abs((lw.y + rw.y) / 2 - (ls.y + rs.y) / 2) < 0.30;
  if (gap < OPEN_NEAR && wristsAroundChest) openHandsNear = true;
  const fire = openHandsNear && gap > OPEN_FAR;
  const triggered = holdGate(openOutState, fire);
  if (triggered) openHandsNear = false;
  return triggered;
}

/* --- Take a Photo = torso rotation. Shoulder width foreshortens when
   the user rotates around the vertical axis. We keep a rolling
   "facing-forward" baseline (max-tracking) and trigger when the
   current shoulder width falls below ROTATE_RATIO of it. */
let baselineShoulderW = null;
const rotateState = { frames: 0, last: 0 };
function detectRotate(lm) {
  const ls = lm[11], rs = lm[12];
  if (!visible(ls) || !visible(rs)) return false;
  const sw = dist(ls, rs) || 0.2;
  if (baselineShoulderW === null) { baselineShoulderW = sw; return false; }
  if (sw > baselineShoulderW) baselineShoulderW = baselineShoulderW * 0.85 + sw * 0.15;
  const ratio = sw / baselineShoulderW;
  return holdGate(rotateState, ratio < ROTATE_RATIO);
}

let lastFires = {};
function processGestures(lm) {
  const clap        = detectClap(lm);
  const lean        = detectLean(lm);
  const crossTap    = detectCrossTap(lm);
  const pushForward = detectPushForward(lm);
  const reachUp     = detectReachUp(lm);
  const openOut     = detectOpenOut(lm);
  const rotate      = detectRotate(lm);
  lastFires = { clap, lean, crossTap, pushForward, reachUp, openOut, rotate };

  if (activeGestureHandler) {
    if (clap)            activeGestureHandler('clap');
    if (lean === 'right') activeGestureHandler('leanRight');
    else if (lean === 'left') activeGestureHandler('leanLeft');
    if (crossTap)    activeGestureHandler('crossTap');
    if (pushForward) activeGestureHandler('pushForward');
    if (reachUp)     activeGestureHandler('reachUp');
    if (openOut)     activeGestureHandler('openOut');
    if (rotate)      activeGestureHandler('rotate');
  }
  updateDebug(lm);
}

/* =====================================================================
   3. STATE MACHINE — sequential lesson progression
   ===================================================================== */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  el('#screen-' + name).classList.remove('hidden');
}

function goState(state) {
  activeGestureHandler = null;
  activeExpectedGesture = null;
  currentSkipAction = null;
  clearTimeout(helpTimer);
  clearTimeout(failureTimer);

  switch (state) {
    case 'name':
      showScreen('name');
      setupName();
      break;
    case 'intro':
      showScreen('intro');
      runIntro(() => startLesson(0));
      break;
    case 'lesson-tutorial':
      currentLesson = CONTENT.lessons[lessonIdx];
      showScreen('tutorial');
      runTutorial(currentLesson, () => goState('lesson-countdown-p1'));
      break;
    case 'lesson-countdown-p1':
      // Plain countdown before "Your first turn" — no recording yet.
      showScreen('getready');
      runCountdown(/* withRecording */ false, () => goState('lesson-practice1'));
      break;
    case 'lesson-practice1':
      showScreen('practice');
      setupPractice(currentLesson, /* turn */ 1,
        () => goState('lesson-p1-success'),
        () => goState('lesson-p1-failure'));
      break;
    case 'lesson-p1-success':
      // Confetti is the visible reward AND the silent 3s recording lead-in
      // for Practice 2.  Recording starts here so the clip includes the
      // 3 seconds BEFORE "Your second turn" appears.
      el('#success-msg').textContent = CONTENT.p1SuccessText || CONTENT.successText;
      showScreen('success');
      beginPractice2Recording();
      runConfetti(() => goState('lesson-practice2'));
      break;
    case 'lesson-p1-failure':
      // Recommendation, then retry Practice 1.
      showScreen('failure');
      runFailure(() => goState('lesson-practice1'));
      break;
    case 'lesson-practice2':
      showScreen('practice');
      setupPractice(currentLesson, /* turn */ 2,
        () => goState('lesson-p2-success'),
        () => goState('lesson-p2-failure'));
      break;
    case 'lesson-p2-success':
      // The recorder keeps running in the background for POST_CAPTURE_MS
      // after the gesture (scheduled in setupPractice); the clip is saved
      // when that timer fires.  Confetti rolls in parallel.
      el('#success-msg').textContent = CONTENT.successText;
      showScreen('success');
      runConfetti(() => startLesson(lessonIdx + 1));
      break;
    case 'lesson-p2-failure':
      // Recording already aborted in setupPractice's failure timer.
      // Show recommendation, then countdown (which starts a fresh
      // 3s recording lead-in) before retrying Practice 2.
      showScreen('failure');
      runFailure(() => goState('lesson-countdown-p2'));
      break;
    case 'lesson-countdown-p2':
      // Countdown before a Practice 2 retry — also opens a fresh recording.
      showScreen('getready');
      runCountdown(/* withRecording */ true, () => goState('lesson-practice2'));
      break;
    case 'all-complete':
      el('#success-msg').textContent = CONTENT.completeText;
      showScreen('success');
      runConfetti(async () => {
        await waitForPendingRecordings();
        playReel();
      });
      break;
  }
}

function setupName() {
  const input = el('#name-input');
  const button = el('#name-btn');
  el('#name-eyebrow').textContent = CONTENT.name.eyebrow;
  el('#name-question').textContent = CONTENT.name.question;
  button.textContent = CONTENT.name.button;
  input.value = participantName;
  setTimeout(() => input.focus(), 50);

  const submit = () => {
    participantName = input.value.trim();
    recordedClips.forEach(clip => URL.revokeObjectURL(clip.url));
    recordedClips = [];
    goState('intro');
  };
  currentSkipAction = submit;
  button.onclick = submit;
  input.onkeydown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  };
}

function startLesson(idx) {
  if (idx >= CONTENT.lessons.length) {
    goState('all-complete');
    return;
  }
  lessonIdx = idx;
  goState('lesson-tutorial');
}

/* =====================================================================
   4. INTRO + TUTORIAL — single-video players with placeholder fallback
   ===================================================================== */
function playVideoOnce({ videoEl, placeholderEl, src, placeholderLabel }, onDone) {
  let advanced = false;
  let phTimer = null, maxTimer = null;
  function cleanup() {
    videoEl.onended = videoEl.onerror = videoEl.oncanplay = null;
    clearTimeout(phTimer); clearTimeout(maxTimer);
  }
  function done() {
    if (advanced) return;
    advanced = true;
    cleanup();
    currentSkipAction = null;
    onDone();
  }
  currentSkipAction = () => {
    videoEl.pause();
    done();
  };

  videoEl.classList.remove('hidden');
  placeholderEl.classList.add('hidden');

  videoEl.oncanplay = () => {
    placeholderEl.classList.add('hidden');
    videoEl.classList.remove('hidden');
    videoEl.play().catch(() => {});
  };
  videoEl.onended = done;
  videoEl.onerror = () => {
    videoEl.classList.add('hidden');
    placeholderEl.classList.remove('hidden');
    const lbl = placeholderEl.querySelector('.ph-label');
    if (lbl && placeholderLabel) lbl.textContent = placeholderLabel;
    phTimer = setTimeout(done, PLACEHOLDER_MS);
  };
  maxTimer = setTimeout(done, MAX_STEP_MS);

  videoEl.src = encodeURI(src);
  videoEl.load();
}

function runIntro(onDone) {
  playVideoOnce({
    videoEl: el('#intro-video'),
    placeholderEl: el('#intro-placeholder'),
    src: CONTENT.intro.video,
    placeholderLabel: 'Intro',
  }, onDone);
}

function runTutorial(lesson, onDone) {
  el('#tutorial-title').textContent = lesson.name;
  el('#tutorial-step-label').textContent = CONTENT.watchPrompt || '';
  playVideoOnce({
    videoEl: el('#tutorial-video'),
    placeholderEl: el('#tutorial-placeholder'),
    src: lesson.video,
    placeholderLabel: lesson.name,
  }, onDone);
}

/* =====================================================================
   5. COUNTDOWN — 3..2..1 transition screen used in two places:
        - before "Your first turn" (no recording)
        - before retrying "Your second turn" after a failure
          (with `withRecording`, opens a fresh recording window so the
           clip still captures the 3s BEFORE Practice 2 reappears)
   ===================================================================== */
function runCountdown(withRecording, onDone) {
  el('#getready-text').textContent = CONTENT.getReadyPrompt || 'Get ready…';
  const countEl = el('#getready-count');

  if (withRecording) beginPractice2Recording();

  let remaining = Math.max(1, Math.round(GET_READY_MS / 1000));
  countEl.textContent = remaining;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearInterval(tick);
    currentSkipAction = null;
    onDone();
  };
  const tick = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      finish();
    } else {
      countEl.textContent = remaining;
    }
  }, 1000);
  currentSkipAction = finish;
}

/* =====================================================================
   6. PRACTICE — drives both Practice 1 (no recording) and Practice 2
                 (silent recording, clip saved on success).
   ===================================================================== */
function select(which) {
  currentSelection = which;
  el('#next-btn').classList.toggle('selected', which === 'next');
  el('#bad-btn').classList.toggle('selected', which === 'bad');
}

function setupPractice(lesson, turn, onSuccess, onFailure) {
  const isRecorded = turn === 2;
  const nextBtn = el('#next-btn');
  el('#bad-btn').classList.add('hidden');
  el('#help-text').classList.add('hidden');

  if (lesson.showNextButton) {
    nextBtn.classList.remove('hidden');
    select('next');
  } else {
    nextBtn.classList.add('hidden');
  }

  const prefix = isRecorded ? CONTENT.practice2Prefix : CONTENT.practice1Prefix;
  el('#practice-instruction').textContent = (prefix || '') + lesson.instruction;

  activeExpectedGesture = lesson.gestureKey;

  failureTimer = setTimeout(() => {
    if (isRecorded) abortPractice2Recording();
    activeGestureHandler = null;
    onFailure();
  }, FAILURE_MS);

  helpTimer = setTimeout(showHelp, HELP_DELAY_MS);

  const succeed = (skipPostCapture = false) => {
    activeGestureHandler = null;
    currentSkipAction = null;
    clearTimeout(failureTimer);
    clearTimeout(helpTimer);

    if (isRecorded) {
      const finishRecording = async () => {
        await endPractice2Recording(lesson);
      };
      if (skipPostCapture) {
        trackPendingRecording(finishRecording());
      } else {
        trackPendingRecording(new Promise((resolve) => {
          setTimeout(async () => {
            await finishRecording();
            resolve();
          }, POST_CAPTURE_MS);
        }));
      }
    }
    onSuccess();
  };

  activeGestureHandler = (g) => {
    if (g !== lesson.gestureKey) return;
    succeed(false);
  };
  currentSkipAction = () => succeed(true);
}

function showHelp() {
  const h = el('#help-text');
  h.textContent = CONTENT.helpText;
  h.classList.remove('hidden');
}

/* =====================================================================
   7. FAILURE — concise feedback + red visual cue, then auto-retry.
   ===================================================================== */
function runFailure(onDone) {
  el('#failure-text').textContent = CONTENT.failureText;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    currentSkipAction = null;
    onDone();
  };
  const timer = setTimeout(finish, FAILURE_SHOW_MS);
  currentSkipAction = finish;
}

/* =====================================================================
   8. SUCCESS — confetti for ~3 seconds, then continue (unchanged)
   ===================================================================== */
let confettiCtx = null, confettiParticles = [], confettiRAF = null;
function sizeConfetti() {
  const c = el('#confetti');
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  confettiCtx = c.getContext('2d');
}
function runConfetti(onDone) {
  const colors = ['#1f9cff', '#ef4d4d', '#ffd400', '#2faa4f', '#16181d', '#c14dff'];
  confettiParticles = Array.from({ length: 160 }, () => ({
    x: Math.random() * window.innerWidth,
    y: -20 - Math.random() * window.innerHeight,
    r: 5 + Math.random() * 7,
    vy: 2 + Math.random() * 4,
    vx: -2 + Math.random() * 4,
    color: colors[(Math.random() * colors.length) | 0],
    rot: Math.random() * Math.PI,
    vr: -0.2 + Math.random() * 0.4,
  }));

  const stop = performance.now() + CONFETTI_MS;
  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(confettiRAF);
    confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    currentSkipAction = null;
    onDone();
  }
  currentSkipAction = finish;
  function frame() {
    confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const p of confettiParticles) {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate(p.rot);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
      confettiCtx.restore();
    }
    if (performance.now() < stop) {
      confettiRAF = requestAnimationFrame(frame);
    } else {
      finish();
    }
  }
  frame();
}

/* =====================================================================
   9. RECORDING — MediaRecorder for the silent Practice 2 clip, plus
                  IndexedDB persistence.  Clip merging/exporting is out
                  of scope; clips are stored for a future pass.
   ===================================================================== */
const DB_NAME = 'elderscroll';
const DB_VERSION = 1;
const STORE = 'clips';

function openClipsDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveClip({ blob, lessonId, lessonName, gestureLabel }) {
  try {
    const db = await openClipsDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const record = {
        lessonId,
        lessonName,
        gestureLabel,
        timestamp: new Date().toISOString(),
        mimeType: blob.type,
        size: blob.size,
        blob,
      };
      const req = store.add(record);
      req.onsuccess = () => {
        const id = req.result;
        const clipReference = `idb://${DB_NAME}/${STORE}/${id}`;
        console.log('[ElderScroll] clip saved', {
          id, lessonId, lessonName, gestureLabel,
          timestamp: record.timestamp, size: record.size, clipReference,
        });
        resolve({ id, clipReference });
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('[ElderScroll] saveClip failed', err);
  }
}

let mediaRecorder = null;
let recordingChunks = [];
let recordedClips = [];
const pendingRecordings = new Set();

function trackPendingRecording(promise) {
  pendingRecordings.add(promise);
  promise.finally(() => pendingRecordings.delete(promise));
}

async function waitForPendingRecordings() {
  await Promise.all([...pendingRecordings]);
}

function beginPractice2Recording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    console.warn('[ElderScroll] recording already in progress');
    return false;
  }
  recordingChunks = [];
  const stream = camera && camera.srcObject;
  if (!stream || typeof MediaRecorder === 'undefined') {
    mediaRecorder = null;
    console.warn('[ElderScroll] recording unavailable: camera stream or MediaRecorder missing');
    return false;
  }
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
  const mime = candidates.find(t => MediaRecorder.isTypeSupported(t));
  try {
    mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordingChunks.push(e.data);
    };
    mediaRecorder.start();
    console.log('[ElderScroll] recording started');
    return true;
  } catch (err) {
    console.error('[ElderScroll] MediaRecorder failed to start', err);
    mediaRecorder = null;
    recordingChunks = [];
    return false;
  }
}

function endPractice2Recording(lesson) {
  return new Promise((resolve) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      mediaRecorder = null;
      resolve();
      return;
    }
    const mime = mediaRecorder.mimeType || 'video/webm';
    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordingChunks, { type: mime });
      recordingChunks = [];
      mediaRecorder = null;
      if (blob.size > 0) {
        recordedClips.push({
          lessonId: lesson.id,
          lessonName: lesson.name,
          order: lesson.order ?? CONTENT.lessons.findIndex(item => item.id === lesson.id),
          blob,
          url: URL.createObjectURL(blob),
        });
        console.log(
          `[ElderScroll] recording saved: ${lesson.lessonName || lesson.name} · ` +
          `${Math.round(blob.size / 1024)} KB · ${recordedClips.length} clip(s)`
        );
      }
      await saveClip({
        blob,
        lessonId: lesson.id,
        lessonName: lesson.name,
        gestureLabel: lesson.gestureLabel,
      });
      resolve();
    };
    try {
      mediaRecorder.stop();
    } catch (err) {
      console.error('[ElderScroll] MediaRecorder stop failed', err);
      mediaRecorder = null;
      recordingChunks = [];
      resolve();
    }
  });
}

function abortPractice2Recording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.onstop = () => {
      recordingChunks = [];
      mediaRecorder = null;
    };
    try { mediaRecorder.stop(); } catch (_) { mediaRecorder = null; }
  } else {
    recordingChunks = [];
    mediaRecorder = null;
  }
}

/* TESTING ONLY — remove R/P/S controls and #test-recording-status before demo. */
function setTestRecordingStatus(message, active = false) {
  const status = el('#test-recording-status');
  status.textContent = message;
  status.classList.toggle('active', active);
  status.classList.toggle('hidden', !message);
}

function recordTestClip() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    console.warn('[TEST] Recording already in progress; press P after it finishes.');
    setTestRecordingStatus('RECORDING ALREADY RUNNING', true);
    return;
  }

  const testLesson = currentLesson || {
    id: `test-${Date.now()}`,
    name: 'Test clip',
    gestureLabel: 'Presenter test recording',
    order: recordedClips.length,
  };
  if (!beginPractice2Recording()) {
    setTestRecordingStatus('TEST RECORDING COULD NOT START');
    return;
  }

  console.log('[TEST] Recording five-second clip…');
  setTestRecordingStatus('● TEST RECORDING — 5 SECONDS', true);
  const pending = new Promise((resolve) => {
    setTimeout(async () => {
      await endPractice2Recording(testLesson);
      console.log('[TEST] Clip saved. Press P to preview the stitched reel.');
      setTestRecordingStatus('TEST CLIP SAVED — PRESS P');
      resolve();
    }, 5000);
  });
  trackPendingRecording(pending);
}

async function previewRecordedClips() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    console.log('[TEST] Waiting for the current recording to finish…');
    setTestRecordingStatus('WAITING FOR RECORDING TO FINISH…', true);
  }
  await waitForPendingRecordings();
  console.log(`[TEST] Rendering ${recordedClips.length} recorded clip(s)…`);
  setTestRecordingStatus('');
  playReel();
}

/* =====================================================================
   10. REEL — combine Practice 2 clips, reveal, download, and upload
   ===================================================================== */
const REC_W = 854;
const REC_H = 480;
const SEG_THRESHOLD = 0.5;
let segInvert = false;
let segCanvas = null;
let segCtx = null;
let reelRAF = null;
let reelRecorder = null;

function loadBackground() {
  bgImage = new Image();
  bgImage.onload = () => {
    bgReady = true;
    console.log('[ElderScroll] reveal background ready');
  };
  bgImage.onerror = () => {
    console.warn('[ElderScroll] reveal background failed to load:', CONFIG.recordBackground);
  };
  bgImage.src = CONFIG.recordBackground;
}

function ensureSegCanvas() {
  if (segCanvas) return;
  segCanvas = document.createElement('canvas');
  segCanvas.width = REC_W;
  segCanvas.height = REC_H;
  segCtx = segCanvas.getContext('2d', { willReadFrequently: true });
}

function compositeFrame(source, destCtx) {
  segCtx.drawImage(source, 0, 0, REC_W, REC_H);
  imageSegmenter.segmentForVideo(segCanvas, performance.now(), (result) => {
    const mask = result.confidenceMasks && result.confidenceMasks[0];
    if (!mask) {
      destCtx.drawImage(segCanvas, 0, 0);
      return;
    }
    const foreground = mask.getAsFloat32Array();
    const image = segCtx.getImageData(0, 0, REC_W, REC_H);
    for (let i = 0; i < foreground.length; i++) {
      const person = segInvert ? 1 - foreground[i] : foreground[i];
      image.data[i * 4 + 3] = person > SEG_THRESHOLD ? 255 : 0;
    }
    segCtx.putImageData(image, 0, 0);
    destCtx.drawImage(bgImage, 0, 0, REC_W, REC_H);
    destCtx.drawImage(segCanvas, 0, 0);
  });
}

function pickReelMime() {
  const candidates = [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm',
  ];
  return candidates.find(type => MediaRecorder.isTypeSupported(type)) || '';
}

function playReel() {
  showScreen('reveal');
  currentSkipAction = null;
  if (!recordedClips.length) {
    setUploadUi(CONTENT.reveal.noClips, '');
    return;
  }
  if (reelRecorder) return;

  recordedClips.sort((a, b) => a.order - b.order);
  setUploadUi(CONTENT.reveal.rendering, '');

  const source = el('#reel-source');
  const canvas = el('#reel-canvas');
  const context = canvas.getContext('2d');
  const useBackground = Boolean(
    CONFIG.recordBackground && imageSegmenter && bgReady
  );
  canvas.width = REC_W;
  canvas.height = REC_H;
  if (useBackground) ensureSegCanvas();

  const reelMime = pickReelMime();
  const extension = reelMime.includes('mp4') ? 'mp4' : 'webm';
  const chunks = [];
  reelRecorder = new MediaRecorder(
    canvas.captureStream(30),
    reelMime ? { mimeType: reelMime } : undefined
  );
  reelRecorder.ondataavailable = event => {
    if (event.data && event.data.size) chunks.push(event.data);
  };
  reelRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: reelMime || 'video/webm' });
    reelRecorder = null;
    finalizeReel(blob, extension);
  };
  reelRecorder.start();

  let clipIndex = 0;
  let advancing = false;
  let watchdog = null;

  function draw() {
    if (!source.paused && !source.ended) {
      if (useBackground) compositeFrame(source, context);
      else context.drawImage(source, 0, 0, REC_W, REC_H);
    }
    reelRAF = requestAnimationFrame(draw);
  }

  function finish() {
    cancelAnimationFrame(reelRAF);
    reelRAF = null;
    clearTimeout(watchdog);
    source.onended = source.onloadedmetadata = source.onplay = null;
    if (reelRecorder && reelRecorder.state !== 'inactive') reelRecorder.stop();
  }

  function playNext() {
    if (clipIndex >= recordedClips.length) {
      finish();
      return;
    }
    source.src = recordedClips[clipIndex++].url;
    source.play().catch(error => {
      console.warn('[ElderScroll] reel clip could not play', error);
    });
  }

  function advance() {
    if (advancing) return;
    advancing = true;
    clearTimeout(watchdog);
    playNext();
  }

  source.onended = advance;
  source.onloadedmetadata = () => {
    const duration = Number.isFinite(source.duration) && source.duration > 0
      ? source.duration
      : (GET_READY_MS + POST_CAPTURE_MS) / 1000;
    clearTimeout(watchdog);
    watchdog = setTimeout(advance, duration * 1000 + 1000);
  };
  source.onplay = () => {
    advancing = false;
    if (!reelRAF) draw();
  };
  playNext();
}

function reelFilename(extension) {
  const safeName = (participantName || 'reel')
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/^_+|_+$/g, '');
  return `${safeName || 'reel'}.${extension}`;
}

function finalizeReel(blob, extension) {
  triggerDownload(blob, extension);
  uploadReel(blob, extension);
}

function triggerDownload(blob, extension) {
  const anchor = document.createElement('a');
  const url = URL.createObjectURL(blob);
  anchor.href = url;
  anchor.download = reelFilename(extension);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function uploadReel(blob, extension) {
  setUploadUi(CONTENT.reveal.uploadPending, '');
  try {
    const params = new URLSearchParams({
      name: participantName || 'Anonymous',
      ext: extension,
    });
    const response = await fetch(`${UPLOAD_ENDPOINT}?${params}`, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || `video/${extension}` },
      body: blob,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || `Upload failed (${response.status})`);
    }
    const shareUrl = result.url ||
      (result.id ? `${VIDEO_LIBRARY_URL}/v/${result.id}` : '');
    if (!shareUrl) throw new Error('Upload succeeded without a video URL');
    setUploadUi(CONTENT.reveal.uploadSuccess, shareUrl);
  } catch (error) {
    console.warn('[ElderScroll] Lovable upload failed; local copy was kept', error);
    setUploadUi(CONTENT.reveal.uploadFailed, '');
  }
}

function setUploadUi(message, shareUrl) {
  const status = el('#upload-status');
  const link = el('#download-link');
  status.textContent = message;
  if (shareUrl) {
    link.href = shareUrl;
    link.textContent = CONTENT.reveal.downloadButton;
    link.classList.remove('hidden');
  } else {
    link.removeAttribute('href');
    link.classList.add('hidden');
  }
}

/* =====================================================================
   11. PRESENTER KEYS + DEBUG (fallback so a demo never stalls)
   ===================================================================== */
function setupPresenterKeys() {
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 's') {
      e.preventDefault();
      if (currentSkipAction) {
        console.log('[TEST] Skipping current step');
        const skip = currentSkipAction;
        currentSkipAction = null;
        skip();
      } else {
        console.log('[TEST] Nothing to skip on this screen');
      }
      return;
    }

    const target = e.target;
    if (target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    )) return;

    if (e.key === ' ') {
      e.preventDefault();
      // Space fires whatever gesture the current practice expects.
      if (activeGestureHandler && activeExpectedGesture) {
        activeGestureHandler(activeExpectedGesture);
      } else if (activeGestureHandler) {
        activeGestureHandler('clap');
      }
    } else if (e.key === 'ArrowRight') {
      if (activeGestureHandler) activeGestureHandler('leanRight');
    } else if (e.key === 'ArrowLeft') {
      if (activeGestureHandler) activeGestureHandler('leanLeft');
    } else if (key === 'r') {
      recordTestClip();
    } else if (key === 'p') {
      previewRecordedClips();
    } else if (key === 'd') {
      el('#debug').classList.toggle('hidden');
    } else if (key === 'i') {
      segInvert = !segInvert;
      console.log('[ElderScroll] segmentation inverted:', segInvert);
    }
  });
}

function updateDebug(lm) {
  const dbg = el('#debug');
  if (dbg.classList.contains('hidden')) return;
  const ls = lm[11], rs = lm[12];
  const cx = (ls.x + rs.x) / 2;
  const sw = Math.abs(ls.x - rs.x) || 0.2;
  const wristRatio = dist(lm[15], lm[16]) / sw;
  const leanOffset = baselineX === null ? 0 : (cx - baselineX) / sw;
  const rotateR = baselineShoulderW ? sw / baselineShoulderW : 1;
  const fires = Object.entries(lastFires)
    .filter(([_, v]) => v && v !== false)
    .map(([k, v]) => v === true ? k : `${k}=${v}`)
    .join(' ');
  const crossTapStr = isFinite(lastCrossTapDist) ? lastCrossTapDist.toFixed(2) : '-';
  dbg.textContent =
    `lesson: ${currentLesson ? currentLesson.id : '-'}  expect: ${activeExpectedGesture || '-'}\n` +
    `wrist/shoulder: ${wristRatio.toFixed(2)}\n` +
    `cross-tap dist: ${crossTapStr} (<${CROSS_TAP_DIST})\n` +
    `lean offset:    ${leanOffset.toFixed(2)} (>${LEAN_ENTER})\n` +
    `rotate ratio:   ${rotateR.toFixed(2)} (<${ROTATE_RATIO})\n` +
    `last z (lw/rw): ${(lm[15].z ?? 0).toFixed(2)} / ${(lm[16].z ?? 0).toFixed(2)}\n` +
    `push: ${pushArmed ? 'ARMED' : 'idle'} (back > ${PUSH_BACK_Z}, fwd < ${PUSH_FORWARD_Z})\n` +
    `fires: ${fires || '-'}`;
}

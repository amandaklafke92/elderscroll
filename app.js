/* =====================================================================
   ElderScroll — gesture-driven onboarding flow
   Pure static app: HTML + CSS + this file. MediaPipe loaded from a CDN.
   ===================================================================== */

/* ---------- Tunable constants — sourced from the persona's config.js ---------- */
const CLAP_APART      = CONFIG.clapApart;
const CLAP_TOGETHER   = CONFIG.clapTogether;
const CLAP_COOLDOWN   = CONFIG.clapCooldown;

const LEAN_ENTER      = CONFIG.leanEnter;
const LEAN_EXIT       = CONFIG.leanExit;
const LEAN_RIGHT_SIGN = CONFIG.leanRightSign;

const PLACEHOLDER_MS  = CONFIG.placeholderMs;
const MAX_STEP_MS     = CONFIG.maxStepMs;
const CONFETTI_MS     = CONFIG.confettiMs;
const HELP_DELAY_MS   = CONFIG.helpDelayMs;

/* ---------- MediaPipe CDN locations (verified reachable) ---------- */
const MP_BUNDLE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs';
const MP_WASM   = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
const MP_MODEL  = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

/* ---------- Tiny DOM helper ---------- */
const el = (sel) => document.querySelector(sel);

/* ---------- App state ---------- */
let poseLandmarker = null;
let camera = null;
let lastVideoTime = -1;
let activeGestureHandler = null;   // set by practice + library screens; null elsewhere
let currentSelection = 'next';     // which button currently has the yellow border
let helpTimer = null;

/* =====================================================================
   1. STARTUP — camera + MediaPipe, triggered by the Start button
   ===================================================================== */
window.addEventListener('DOMContentLoaded', () => {
  camera = el('#camera');
  el('#start-btn').addEventListener('click', start, { once: true });
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

    requestAnimationFrame(detectLoop);
    goState('lesson1-tutorial');
  } catch (err) {
    console.error(err);
    status.textContent = 'Could not start: ' + err.message +
      '  — make sure you allowed the camera and are on localhost.';
    el('#start-btn').classList.remove('hidden');
  }
}

/* =====================================================================
   2. DETECTION LOOP — runs every frame once the model is ready
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

/* ---------- Gesture detectors (our own code on top of the landmarks) ---------- */
// MediaPipe pose landmark indices we use:
//   11 left shoulder · 12 right shoulder · 15 left wrist · 16 right wrist
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const visible = (p) => p && (p.visibility === undefined || p.visibility > 0.5);

let handsApart = false;
let lastClapTime = 0;
function detectClap(lm) {
  const lw = lm[15], rw = lm[16], ls = lm[11], rs = lm[12];
  if (!visible(lw) || !visible(rw) || !visible(ls) || !visible(rs)) return false;
  const shoulderWidth = dist(ls, rs) || 0.2;
  const ratio = dist(lw, rw) / shoulderWidth;      // wrist gap, scaled to body size
  if (ratio > CLAP_APART) handsApart = true;        // hands have separated
  if (handsApart && ratio < CLAP_TOGETHER) {        // ...and come back together
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
let leanState = 'center';   // hysteresis so one lean fires once
function detectLean(lm) {
  const ls = lm[11], rs = lm[12];
  if (!visible(ls) || !visible(rs)) return null;
  const cx = (ls.x + rs.x) / 2;
  const shoulderWidth = Math.abs(ls.x - rs.x) || 0.2;
  if (baselineX === null) { baselineX = cx; return null; }

  const offset = (cx - baselineX) / shoulderWidth;  // sideways shift, scaled to body size
  let dir = null;
  if (offset * LEAN_RIGHT_SIGN > LEAN_ENTER) dir = 'right';
  else if (offset * LEAN_RIGHT_SIGN < -LEAN_ENTER) dir = 'left';

  if (dir && leanState === 'center') { leanState = dir; return dir; }
  if (!dir && Math.abs(offset) < LEAN_EXIT) {
    leanState = 'center';
    baselineX = baselineX * 0.95 + cx * 0.05;        // slowly re-centre when upright
  }
  return null;
}

function processGestures(lm) {
  const clap = detectClap(lm);
  const lean = detectLean(lm);   // 'left' | 'right' | null
  if (activeGestureHandler) {
    if (clap) activeGestureHandler('clap');
    if (lean === 'right') activeGestureHandler('leanRight');
    else if (lean === 'left') activeGestureHandler('leanLeft');
  }
  updateDebug(lm, clap, lean);
}

/* =====================================================================
   3. STATE MACHINE — the exact onboarding flow
   ===================================================================== */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  el('#screen-' + name).classList.remove('hidden');
}

function goState(state) {
  activeGestureHandler = null;          // ignore gestures unless a screen opts in
  switch (state) {
    case 'lesson1-tutorial':
      showScreen('tutorial');
      runTutorial(1, () => goState('lesson1-practice'));
      break;
    case 'lesson1-practice':
      showScreen('practice');
      setupPractice(1);
      break;
    case 'lesson1-success':
      showScreen('success');
      runConfetti(() => goState('lesson2-tutorial'));
      break;
    case 'lesson2-tutorial':
      showScreen('tutorial');
      runTutorial(2, () => goState('lesson2-practice'));
      break;
    case 'lesson2-practice':
      showScreen('practice');
      setupPractice(2);
      break;
    case 'lesson2-success':
      showScreen('success');
      runConfetti(() => goState('library'));    // onboarding done -> library
      break;
    case 'library':
      showScreen('library');
      setupLibrary();
      break;
  }
}

/* =====================================================================
   4. TUTORIAL — two video slots, placeholders if assets are missing
   ===================================================================== */
function runTutorial(lesson, onDone) {
  const labels = CONTENT.tutorials[lesson].steps;
  const steps = [
    { src: `assets/tutorials/lesson${lesson}-finger.mp4`, label: labels[0] },
    { src: `assets/tutorials/lesson${lesson}-body.mp4`,   label: labels[1] },
  ];
  const vid   = el('#tutorial-video');
  const ph    = el('#tutorial-placeholder');
  const lbl   = el('#tutorial-step-label');
  el('#tutorial-title').textContent = CONTENT.tutorials[lesson].title;

  let i = 0;
  function playStep() {
    if (i >= steps.length) { onDone(); return; }
    const s = steps[i];
    lbl.textContent = s.label;

    let advanced = false;
    let phTimer = null, maxTimer = null;
    function cleanup() {
      vid.onended = vid.onerror = vid.oncanplay = null;
      clearTimeout(phTimer); clearTimeout(maxTimer);
    }
    function next() { if (advanced) return; advanced = true; cleanup(); i++; playStep(); }

    vid.classList.remove('hidden');
    ph.classList.add('hidden');

    vid.oncanplay = () => { ph.classList.add('hidden'); vid.classList.remove('hidden'); vid.play().catch(() => {}); };
    vid.onended   = next;
    vid.onerror   = () => {                      // asset missing -> show placeholder, auto-advance
      vid.classList.add('hidden');
      ph.classList.remove('hidden');
      ph.querySelector('.ph-label').textContent = s.label;
      phTimer = setTimeout(next, PLACEHOLDER_MS);
    };

    maxTimer = setTimeout(next, MAX_STEP_MS);    // safety: never get stuck on a step
    vid.src = s.src;
    vid.load();
  }
  playStep();
}

/* =====================================================================
   5. PRACTICE — Lesson 1 (clap) and Lesson 2 (lean then clap)
   ===================================================================== */
function select(which) {
  currentSelection = which;
  el('#next-btn').classList.toggle('selected', which === 'next');
  el('#bad-btn').classList.toggle('selected', which === 'bad');
}

function setupPractice(lesson) {
  const badBtn = el('#bad-btn');
  el('#help-text').classList.add('hidden');
  clearTimeout(helpTimer);

  if (lesson === 1) {
    badBtn.classList.add('hidden');
    select('next');                              // "next" is pre-selected
    el('#practice-instruction').textContent = CONTENT.practice[1];
  } else {
    badBtn.classList.remove('hidden');
    select('bad');                               // "bad" button is pre-selected
    el('#practice-instruction').textContent = CONTENT.practice[2];
  }

  helpTimer = setTimeout(showHelp, HELP_DELAY_MS);
  activeGestureHandler = (g) => handlePractice(lesson, g);
}

function handlePractice(lesson, gesture) {
  if (lesson === 1) {
    if (gesture === 'clap') succeed(1);          // only one button; clap = success
    return;
  }
  // Lesson 2
  if (gesture === 'leanRight') {
    if (currentSelection === 'bad') select('next');
  } else if (gesture === 'leanLeft') {
    if (currentSelection === 'next') select('bad');
  } else if (gesture === 'clap') {
    if (currentSelection === 'next') {
      succeed(2);
    } else {
      // The "bad" button is a decoy only — it performs no real action.
      showHelp();
    }
  }
}

function succeed(lesson) {
  activeGestureHandler = null;
  clearTimeout(helpTimer);
  goState(lesson === 1 ? 'lesson1-success' : 'lesson2-success');
}

function showHelp() {
  const h = el('#help-text');
  h.textContent = CONTENT.helpText;
  h.classList.remove('hidden');
}

/* =====================================================================
   6. SUCCESS — confetti for ~3 seconds, then continue
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
      cancelAnimationFrame(confettiRAF);
      confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      onDone();
    }
  }
  frame();
}

/* =====================================================================
   7. LESSON LIBRARY — appears only after both onboarding lessons
   ===================================================================== */
const LESSONS = CONTENT.lessons;
let libraryIndex = 0;

function setupLibrary() {
  const wrap = el('#library-cards');
  wrap.innerHTML = '';
  LESSONS.forEach((lesson, idx) => {
    const card = document.createElement('div');
    card.className = 'lesson-card' + (lesson.unlocked ? '' : ' locked');
    card.innerHTML =
      `<h3>${lesson.title}</h3><p>${lesson.desc}</p>` +
      `<div class="card-tag">${lesson.unlocked ? 'Ready' : 'Coming soon'}</div>`;
    wrap.appendChild(card);
  });
  libraryIndex = 0;
  highlightLibrary();
  activeGestureHandler = handleLibrary;
}

function highlightLibrary() {
  document.querySelectorAll('.lesson-card').forEach((c, i) =>
    c.classList.toggle('selected', i === libraryIndex));
}

function handleLibrary(gesture) {
  if (gesture === 'leanRight') {
    libraryIndex = Math.min(LESSONS.length - 1, libraryIndex + 1);
    highlightLibrary();
  } else if (gesture === 'leanLeft') {
    libraryIndex = Math.max(0, libraryIndex - 1);
    highlightLibrary();
  } else if (gesture === 'clap') {
    const lesson = LESSONS[libraryIndex];
    if (lesson.unlocked) {
      activeGestureHandler = null;
      goState(lesson.state);                 // re-run that lesson
    } else {
      toast(CONTENT.comingSoonToast);
    }
  }
}

let toastTimer = null;
function toast(msg) {
  const t = el('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 1800);
}

/* =====================================================================
   8. PRESENTER KEYS + DEBUG (fallback so the demo always drives)
   ===================================================================== */
function setupPresenterKeys() {
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ')          { e.preventDefault(); if (activeGestureHandler) activeGestureHandler('clap'); }
    else if (e.key === 'ArrowRight') { if (activeGestureHandler) activeGestureHandler('leanRight'); }
    else if (e.key === 'ArrowLeft')  { if (activeGestureHandler) activeGestureHandler('leanLeft'); }
    else if (e.key === 'd')     { el('#debug').classList.toggle('hidden'); }
  });
}

function updateDebug(lm, clap, lean) {
  const dbg = el('#debug');
  if (dbg.classList.contains('hidden')) return;
  const ls = lm[11], rs = lm[12];
  const cx = (ls.x + rs.x) / 2;
  const sw = Math.abs(ls.x - rs.x) || 0.2;
  const wristRatio = dist(lm[15], lm[16]) / sw;
  const offset = baselineX === null ? 0 : (cx - baselineX) / sw;
  dbg.textContent =
    `state: ${currentSelection}\n` +
    `wrist/shoulder: ${wristRatio.toFixed(2)} (clap < ${CLAP_TOGETHER})\n` +
    `lean offset: ${offset.toFixed(2)} (lean > ${LEAN_ENTER})\n` +
    `last: ${clap ? 'CLAP ' : ''}${lean ? 'LEAN-' + lean : ''}`;
}

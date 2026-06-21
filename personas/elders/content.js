/* =====================================================================
   PERSONA CONTENT — Elders ("ElderScroll")
   All user-facing copy and lesson data for this persona live here.
   The engine (app.js) reads from this CONTENT object and contains no
   persona-specific wording of its own.

   Lessons are built dynamically from the entries in `lessons` — the order
   of the array is the order users progress through. Each lesson binds a
   video file (in /Videos) to a gesture key the engine knows how to
   detect. To reorder lessons later, reorder the array; the gesture
   detector, label, and instruction stay tied to the lesson by `id`.

   Loaded as a plain <script> BEFORE app.js, so `CONTENT` is available
   as a shared global.
   ===================================================================== */
const CONTENT = {
  name: {
    eyebrow: 'WELCOME',
    question: "What's your name?",
    button: 'Begin',
  },

  /* Intro screen plays this video once after the user presses Start. */
  intro: {
    video: 'Videos/intro.mp4',
  },

  /* Lesson manifest.
     Required fields:
       - id              stable identifier (used in stored clip metadata)
       - name            human label shown on the tutorial screen + metadata
       - video           tutorial clip in /Videos (filenames are the truth)
       - gestureKey      detector the engine exposes (crossTap | pushForward
                         | reachUp | openOut | tPose)
       - gestureLabel    short label stored with the recorded clip
       - instruction     short, clear line shown above the camera in practice
                         (HTML allowed; wrap key words in <strong>)

     Optional UI hints (default to off — Click is the simplest baseline):
       - showNextButton    show the on-screen "next" button during practice
       - badButtonText     show a second decoy button to the LEFT of "next"
                           with the supplied label (purely cosmetic)
       - showShutterIcon   show the camera/shutter icon on the practice screen
       - highlightTransition
                           'badToNext' → bad button starts highlighted; the
                           gesture migrates the highlight to "next".
       - startZoomedIn     practice begins with the display layer already at
                           DISPLAY_ZOOM_LEVEL (Zoom Out needs something to
                           zoom out FROM).
       - cameraEffect      fires on a successful gesture:
                             'zoomIn'      → zoom the display layer in
                             'zoomOut'     → reset the display layer to 1.0x
                             'photoFlash'  → iPhone flash + freeze the
                                             captured frame for the hold
                           All effects apply ONLY to the display layer
                           (#camera-display) so MediaPipe's detection feed
                           (#camera) is never scaled.

     After any cameraEffect / highlightTransition fires, the practice screen
     holds for CONFIG.effectHoldMs (default 3s) so the user can SEE the
     effect, then transitions to the success screen. */
  lessons: [
    {
      id: 'click',
      name: 'Click',
      video: 'Videos/clic.mp4',
      gestureKey: 'crossTap',
      gestureLabel: 'Tap opposite shoulder',
      instruction: 'Tap your <strong>opposite shoulder</strong> with one hand.',
      showNextButton: true,
    },
    {
      id: 'move',
      name: 'Move',
      video: 'Videos/swipe.mp4',
      gestureKey: 'pushForward',
      gestureLabel: 'Push both arms forward',
      instruction: 'Push <strong>both arms forward</strong>, like a gentle swipe.',
      showNextButton: true,
      badButtonText: 'If you stay on this button, your bank account PIN will be posted to Facebook.',
      highlightTransition: 'badToNext',
    },
    {
      id: 'zoom-in',
      name: 'Zoom In',
      video: 'Videos/zoom in.mp4',
      gestureKey: 'reachUp',
      gestureLabel: 'Reach one arm up, then the other',
      instruction: 'Raise <strong>one arm</strong> above your head, then raise <strong>the other</strong>.',
      cameraEffect: 'zoomIn',
    },
    {
      id: 'zoom-out',
      name: 'Zoom Out',
      video: 'Videos/zoom out.mp4',
      gestureKey: 'openOut',
      gestureLabel: 'Open both arms out wide',
      instruction: 'Start with your hands at your chest, then <strong>open both arms out wide</strong>.',
      startZoomedIn: true,
      cameraEffect: 'zoomOut',
    },
    {
      id: 'take-photo',
      name: 'Take a Photo',
      video: 'Videos/takeaphoto.mp4',
      gestureKey: 'tPose',
      gestureLabel: 'Open both arms out to the sides (T-pose)',
      instruction: 'Stretch <strong>both arms straight out to the sides</strong>, like a cross.',
      showShutterIcon: true,
      cameraEffect: 'photoFlash',
    },
  ],

  /* Tutorial screen labels. */
  watchPrompt: "Watch how it's done.",

  /* Practice screen instruction prefixes. The recording on Practice 2
     happens silently — the prefix gives no hint of it. */
  practice1Prefix: 'Your first turn — ',
  practice2Prefix: 'Your second turn — ',

  /* Countdown screen shown before each practice attempt. */
  getReadyPrompt: 'Get ready…',

  /* Success screens. */
  p1SuccessText: 'Nice!',
  successText: 'Well done!',
  completeText: "You're all set!",
  giftText: "Here's a little gift for all your hard work!",

  reveal: {
    uploadFailed: 'Your video was saved on this computer, but could not reach the download library.',
    noClips: 'No Practice 2 clips were recorded.',
    downloadButton: 'Download your video',
  },

  /* Shown after a while with no success on a practice screen. Kept short
     and direct — two simple instructions, no preamble. */
  helpText: 'Hands and head visible. Move bigger.',

  /* Failure feedback. */
  failureText: "Hmm, I didn't catch that. Let's try once more.",
};

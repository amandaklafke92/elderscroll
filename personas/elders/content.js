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
     - `id`            stable identifier (used in stored clip metadata)
     - `name`          human label shown on the tutorial screen + in stored metadata
     - `video`         tutorial clip in /Videos (filenames are the source of truth)
     - `gestureKey`    must match a detector the engine exposes
                       (crossTap | pushForward | reachUp | openOut | rotate)
     - `gestureLabel`  short label stored with the recorded clip
     - `instruction`   short, clear line shown above the camera in practice
     - `showNextButton` optional; only the "Click" lesson uses the on-screen button */
  lessons: [
    {
      id: 'click',
      name: 'Click',
      video: 'Videos/clic.mp4',
      gestureKey: 'crossTap',
      gestureLabel: 'Tap opposite shoulder',
      instruction: 'Tap your opposite shoulder with one hand.',
      showNextButton: true,
    },
    {
      id: 'move',
      name: 'Move',
      video: 'Videos/swipe.mp4',
      gestureKey: 'pushForward',
      gestureLabel: 'Push both arms forward',
      instruction: 'Push both arms forward, like a gentle swipe.',
    },
    {
      id: 'zoom-in',
      name: 'Zoom In',
      video: 'Videos/zoom in.mp4',
      gestureKey: 'reachUp',
      gestureLabel: 'Reach one arm up overhead',
      instruction: 'Raise one arm straight up above your head.',
    },
    {
      id: 'zoom-out',
      name: 'Zoom Out',
      video: 'Videos/zoom out.mp4',
      gestureKey: 'openOut',
      gestureLabel: 'Open both arms out wide',
      instruction: 'Start with your hands at your chest, then open both arms out wide.',
    },
    {
      id: 'take-photo',
      name: 'Take a Photo',
      video: 'Videos/takeaphoto.mp4',
      gestureKey: 'rotate',
      gestureLabel: 'Turn your shoulders to one side',
      instruction: 'Turn your shoulders to one side, as if pointing at something.',
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

  /* Shown after a while with no success on a practice screen. */
  helpText:
    "It's not working… try this… Sit so your head and shoulders fill the camera, " +
    "then make your movement bigger and hold still for a moment afterwards.",

  /* Failure feedback. */
  failureText: "Hmm, I didn't catch that. Let's try once more.",
};

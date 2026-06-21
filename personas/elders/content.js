/* =====================================================================
   PERSONA CONTENT — Elders ("ElderScroll")
   All user-facing copy and lesson data for this persona live here.
   The engine (app.js) reads from this CONTENT object and contains no
   persona-specific wording of its own.

   Loaded as a plain <script> BEFORE app.js, so `CONTENT` is available
   as a shared global. To make a new persona, copy this file, change the
   strings, and point index.html at your copy instead.

   Each lesson is taught as: intro → countdown → one video → "your turn"
   → practice. `<span class="verb">…</span>` highlights the action word(s)
   (the colour is set in theme.css).
   ===================================================================== */
const CONTENT = {
  /* Per-lesson teaching copy. */
  teach: {
    1: {
      intro: {
        eyebrow:  'LESSON 1',
        equation: 'CLAP = CLICK',
        line:     'Clapping presses a button. That is all a click is.',
      },
      ready:    '<span class="verb">Clap</span> in front of the camera to click NEXT.',
      practice: '<span class="verb">Clap</span> in front of the camera.',
    },
    2: {
      intro: {
        eyebrow:  'LESSON 2',
        equation: 'LEAN = CHOOSE',
        line:     'Leaning moves the yellow box to the button you want.',
      },
      // Cue-style instruction: a direct body cue that forces a right side-bend.
      ready:    'Reach down and touch your <span class="verb">right calf</span>. Then <span class="verb">clap</span>.',
      practice: 'Touch your <span class="verb">right calf</span>, then <span class="verb">clap</span>.',
    },
  },

  /* Static heading on the "your turn" screen (same for every lesson). */
  readyTitle: 'YOUR TURN',

  /* Shown after a while with no success on the practice screen. */
  helpText: 'Make your movement bigger and slower.',

  /* Toast when a locked library lesson is chosen. */
  comingSoonToast: 'Coming soon — in a later release.',

  /* Lesson library cards. `state` links an unlocked card back to its flow. */
  library: [
    { title: 'Clap to Click',  desc: 'Clap your hands to press a button.',         state: 'lesson1-tutorial', unlocked: true },
    { title: 'Lean to Choose', desc: 'Lean to move between buttons, clap to pick.', state: 'lesson2-tutorial', unlocked: true },
    { title: 'Raise Hands to Scroll Up', desc: 'Lift both hands to scroll up.',     unlocked: false },
    { title: 'Lean Forward to Scroll',   desc: 'Lean in to scroll down a page.',    unlocked: false },
  ],
};

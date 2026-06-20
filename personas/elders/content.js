/* =====================================================================
   PERSONA CONTENT — Elders ("ElderScroll")
   All user-facing copy and lesson data for this persona live here.
   The engine (app.js) reads from this CONTENT object and contains no
   persona-specific wording of its own.

   Loaded as a plain <script> BEFORE app.js, so `CONTENT` is available
   as a shared global. To make a new persona, copy this file, change the
   strings, and point index.html at your copy instead.
   ===================================================================== */
const CONTENT = {
  /* Tutorial screen: heading + the two step labels, per lesson. */
  tutorials: {
    1: {
      title: 'Lesson 1 — Clap to Click',
      steps: ['Step 1 — On a phone', 'Step 2 — With your body'],
    },
    2: {
      title: 'Lesson 2 — Lean to Choose',
      steps: ['Step 1 — On a phone', 'Step 2 — With your body'],
    },
  },

  /* Practice screen: the instruction line, per lesson. */
  practice: {
    1: 'Clap your hands to press NEXT.',
    2: 'Lean to your right to choose NEXT, then clap to press it.',
  },

  /* Shown after a while with no success on the practice screen. */
  helpText:
    "it's not working... try this... Sit so your head and shoulders fill the camera, " +
    "then make your movement bigger and hold still for a moment afterwards.",

  /* Toast when a locked library lesson is chosen. */
  comingSoonToast: 'Coming soon — in a later release.',

  /* Lesson library cards. `state` links an unlocked card back to its flow. */
  lessons: [
    { title: 'Clap to Click',  desc: 'Clap your hands to press a button.',         state: 'lesson1-tutorial', unlocked: true },
    { title: 'Lean to Choose', desc: 'Lean to move between buttons, clap to pick.', state: 'lesson2-tutorial', unlocked: true },
    { title: 'Raise Hands to Scroll Up', desc: 'Lift both hands to scroll up.',     unlocked: false },
    { title: 'Lean Forward to Scroll',   desc: 'Lean in to scroll down a page.',    unlocked: false },
  ],
};

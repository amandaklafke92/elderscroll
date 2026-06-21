# ElderScroll — Hackathon Action Plan
*Terrible Ideas Hackathon · drafted 2026-06-21 · 6-hour build*

## What we're building (the bit)
A "learn technology with body movements" app for elderly users. The tech-gesture
framing is **misdirection** — each gesture secretly maps to a move from a TikTok.
We record participants performing the moves, stitch the clips together, and reveal
a side-by-side with the original. The reveal is the payoff; the recording is secret
until then.

**Gesture map:** click = clap · move/next = swipe ("lawnmower pull") · zoom in =
punch the air · zoom out = "stop" · take a photo = spin.

**Flow rules:** two practice rounds per move; **only practice 2 is recorded** (after
a 3-2-1 countdown). No music during the flow — it would spoil the surprise. Clips
are filmed/captured out of order but labelled per lesson, so they get reordered at
stitch time.

---

## Owners & action items

### Amanda — recording + stitching + final reveal
- **Build the capture:** record ~4–5s on practice 2, triggered by the 3-2-1 countdown.
  *Practice 2 is the only footage that survives into the final video.*
- **Reuse the existing camera stream** (`app.js` already opens the webcam for gesture
  detection) instead of a second capture pipeline. *Less to build, no camera conflict.*
- **Build the stitch step:** order clips by lesson sequence (not capture order) and
  concatenate. *Clips come in out of order but are labelled per lesson — labels are the sort key.*
- **Own the final reveal screen** (auto-play? big reveal moment? side-by-side with the
  original?). *Not needed right now — but it's the payoff, so it's yours.*

### Camilla — user-flow updates + tutorial videos (+ music, shared)
- **Remove the lesson library; auto-advance lesson → lesson.** *Everyone produces the
  same sequence, which is what stitching needs.*
- **Add practice-1 (throwaway) + practice-2 (recorded) screens with a 3-2-1 countdown.**
  *Gives Amanda a known capture moment; the flubbed practice-1 is part of the comedy.*
- **Record/confirm tutorial clips using cover-story phrasing** ("this is the lawnmower
  motion"). *The misdirection only works if it sells "learning tech," not "dancing."*
- **Keep gesture→action labels wired** in `content.js` / `config.js`. *Labels tag each
  clip to its lesson so it can be reordered.*

### Joumana — camera setup + background (+ music, shared)
- **Research camera placement + an ideal real-world background.** No green screen (it
  would reveal we're recording). *So the physical backdrop has to do the work — pick a
  spot that's clean, well-lit, and consistent for every participant.*
- **Investigate adding a background image in editing** (software segmentation, not chroma
  key). *Stretch goal — flag early if it's too fiddly; we can drop it and just use the
  real background.*
- **Test one clip end-to-end early** if we attempt the background swap. *Compositing is
  the riskiest unknown — fail fast.*

### Shared / to confirm
- **Music (Camilla &/or Joumana):** choose the track that plays under the final video.
  *Only at the reveal — never during the flow.*
- **Render-wait moment (owner TBD):** decide what participants do while the video renders
  rather than staring at a spinner. *Keeps the energy up through the slow bit.*

---

## Priorities (6 hours — protect the core)
1. **Must work:** capture 5 clips + stitch in order + a reveal that plays the result.
2. **Should work:** practice-1/practice-2 flow with countdown; tutorial videos; music.
3. **Stretch (cuttable):** background-image swap; a render-wait mini-moment.

> If background compositing starts eating time, **drop it** and use the real backdrop.
> Don't let the stretch goal sink the core build.

---

## Dependencies & open questions
- **Trigger contract (Amanda ↔ Camilla):** agree the exact event/timing for when
  practice-2 fires and recording starts. Nail this early or you'll debug the seam at hour 5.
- **Clip format/resolution:** agree once up front so stitching + any compositing just work.
- **Camera framing (Amanda ↔ Joumana):** fixed position + consistent framing, so clips
  stitch cleanly and any background swap lines up.
- **Reveal flow:** does the final video auto-play, or is there a "tap to reveal" beat?
  (Amanda owns, decide later.)
- **Demo "user":** whoever plays the participant gets a quiet heads-up they're filmed —
  a gag for the audience, not a gotcha on a real volunteer.

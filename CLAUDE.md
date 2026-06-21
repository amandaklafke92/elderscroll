# CLAUDE.md — How to work in this repo

**ElderScroll** — a localhost, browser-only app (MediaPipe Pose detection, no
backend; pure `index.html` + `app.js` + CSS) built for the **Terrible Ideas
Hackathon**. The absurd bits are intentional.

**Read this before editing anything — humans and AI assistants alike.**

---

## What we're actually building (the bit)

On the surface, ElderScroll "teaches elderly people technology" by mapping body
movements to digital actions. **That framing is misdirection.** The real product:
each gesture secretly corresponds to a move from a specific TikTok video. While
participants think they're learning tech, the laptop camera records them performing
the moves. The clips are reordered, stitched together, and revealed as a
**side-by-side recreation of the original TikTok**. The reveal is the payoff; the
recording stays secret until then.

> This is a hackathon gag demoed in front of an audience — not a real product shipped
> to real elderly people. **We build one version only: the elderly one.** (An earlier
> plan to ship multiple persona versions has been dropped.)

### Gesture map (the new set)
- click = **clap**
- move / next = **swipe** ("lawnmower pull")
- zoom in = **punch the air**
- zoom out = **"stop"**
- take a photo = **spin**

### The flow (new direction)
1. Per gesture: tutorial (cover-story phrasing) → **practice 1** (throwaway) →
   **practice 2** (recorded, after a 3-2-1 countdown).
2. **Only practice 2 is recorded** (~4–5s clip per move).
3. Lessons **auto-advance** (the old lesson library is removed) so every participant
   produces the same sequence.
4. **No music during the flow** — it would spoil the surprise.
5. At the end: clips are reordered **by lesson** (not capture order), stitched into the
   TikTok sequence, an optional background is swapped behind the person, music is added,
   and the result is revealed side-by-side with the original.

### Status — built vs. to build
The engine currently detects **clap + lean** and runs the *original* onboarding flow
(tutorial → practice → success → lesson library). The pivot still needs: the expanded
gesture set, the practice-1/practice-2 split with countdown, removal of the library /
auto-advance, **in-browser recording**, **stitching**, the **reveal screen**, and
(stretch) the **background swap**.

### Who owns what (hackathon)
- **Amanda** — recording + stitching + the final reveal screen.
- **Camilla** — user-flow updates (remove library, auto-advance, practice-1/2,
  countdown) + tutorial videos.
- **Joumana** — camera placement + ideal real-world background; (stretch) background-
  image swap in edit; music (shared with Camilla).

Full plan with the *why* per task: `action-plan_elderscroll-2026-06-20.md`.

---

## Code layout

It's a single app. The code is split into a reusable **engine** and the **ElderScroll
skin** (copy, tuning, look) so wording/visuals/feel can change without touching engine
logic.

```
index.html              ← wiring: loads the skin files, then the engine
app.js                  ← ENGINE: gesture detection, state machine, flow, confetti
base.css                ← layout skeleton: positioning, stacking, sizes, camera
personas/elders/        ← the ElderScroll skin
  config.js             ←   gesture sensitivity + pacing (the "feel" knobs) → CONFIG
  content.js            ←   all on-screen copy + lesson list → CONTENT
  theme.css             ←   colours, fonts, borders (loads after base.css)
assets/                 ← media (tutorial videos, recorded clips, etc.)
```

- **Engine (`app.js` / `base.css`)** holds no copy or styling — it reads everything
  from the `CONFIG` and `CONTENT` globals. The new pivot features (recording, stitching,
  reveal, expanded gestures, practice-1/2) go here.
- **Skin (`personas/elders/*`)** is where copy, tuning numbers, and the look live.
  `config.js` / `content.js` define the `CONFIG` / `CONTENT` globals and load **before**
  `app.js`; `theme.css` loads **after** `base.css`. Keep that order if you edit
  `index.html`.

> The `personas/elders/` folder path is a leftover from the old multi-persona idea —
> harmless, and not worth flattening mid-hackathon. We can collapse it later if we care.

---

## Instructions for AI assistants
- Copy / look / feel changes → edit `personas/elders/*` (`content.js`, `theme.css`,
  `config.js`), not the engine.
- Engine changes (`app.js` / `base.css`) — including the new pivot features above — are
  expected now; just keep copy, colours, and tuning numbers **out** of the engine.

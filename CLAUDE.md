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
> to real elderly people.

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

## Architecture — engine vs. persona

This repo is **one shared engine** plus **persona skins** of the same gesture-driven
product. The first persona is **Elders** ("ElderScroll"); others reuse the exact same
engine.

> **The one rule:** Core logic is shared by every persona. To change how a persona
> looks, reads, or feels, edit ONLY that persona's folder — never the core. A core
> change affects *every* persona; when in doubt, it goes in the persona folder.

### Layout
```
index.html              ← wiring: loads a persona's files, then the engine
app.js                  ← CORE engine: gesture detection, state machine, flow
base.css                ← CORE layout skeleton: positioning, stacking, sizes
personas/
  elders/               ← one persona = one folder
    config.js           ←   gesture sensitivity + pacing (the "feel" knobs)
    content.js          ←   all user-facing copy + the lesson list
    theme.css           ←   the visual identity: colours, fonts, borders, shadows
assets/                 ← shared media (tutorial videos, etc.)
```

### CORE — `app.js` / `base.css`
The engine: gesture detection, the screen state machine, the flow, confetti. It holds
**no** persona wording or styling — it reads everything persona-specific from the
`CONFIG` and `CONTENT` globals. `base.css` is load-bearing layout only (positioning,
z-index, show/hide, the fullscreen camera, gesture-target positions).

**The new pivot features — recording, stitching, the reveal screen, the expanded
gesture set, the practice-1/2 flow — are ENGINE-level (cross-persona).** They live in
`app.js` / `base.css` and land for *every* persona, so coordinate before changing them.

### PERSONA — edit freely, but only inside your own folder
- **`config.js`** → `CONFIG`: clap/lean sensitivity and timing.
- **`content.js`** → `CONTENT`: every on-screen string + the lesson list.
- **`theme.css`** → the whole look; loads *after* `base.css` and paints on top.

`config.js` / `content.js` define globals (`CONFIG`, `CONTENT`) loaded as plain
`<script>`s **before** `app.js`; `theme.css` loads **after** `base.css`. Keep that load
order if you touch `index.html`.

---

## Instructions for AI assistants
- If asked to change **wording, look, colours, fonts, or gesture feel**, edit **only**
  the relevant `personas/<name>/` file — **do not** edit `app.js` or `base.css`.
- If a request needs an engine change (`app.js` / `base.css`) — including any of the new
  pivot features above — **say so explicitly** and flag that it affects every persona
  before doing it.
- Keep the seam clean: no persona-specific strings, colours, or tuning numbers in the
  core.

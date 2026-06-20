# AGENTS.md — How to work in this repo

This repo holds **one shared engine** and **multiple persona versions** of the
same gesture-driven onboarding product. The first persona is **Elders**
("ElderScroll"); others (e.g. a teen version) live alongside it and reuse the
exact same engine.

**Read this before editing anything — humans and AI assistants alike.**

---

## The one rule

> **Core logic is shared by every persona. Persona folders are owned by one
> team each. To change how a persona looks, reads, or feels, edit ONLY that
> persona's folder — never the core.**

A change made to the core affects *every* persona. A change made in
`personas/<name>/` affects only that one. When in doubt, it goes in the
persona folder.

---

## Layout

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

### CORE — do NOT edit to achieve a persona-specific change
- **`app.js`** — the engine. Gesture detection (clap/lean), the screen state
  machine, the onboarding flow, confetti. It contains no persona wording or
  styling; it reads everything persona-specific from the `CONFIG` and
  `CONTENT` globals a persona provides.
- **`base.css`** — load-bearing layout only: element positioning, z-index
  stacking, show/hide, the fullscreen camera, and the gesture-target
  positions. The "bad" button is LEFT of centre and "next" is RIGHT of centre
  **by design (PRD requirement)** — these positions are functional, not
  cosmetic. Do not move them in a theme.

Editing core is sometimes necessary (real engine bugs, new shared features),
but it is a **cross-team change**: coordinate it, because it lands for everyone.

### PERSONA — edit freely, but only inside your own folder
Each persona is three files, all optional to restyle:
- **`config.js`** → a `CONFIG` object: clap/lean sensitivity and timing. Tune
  how easy the gestures are and how patient the app is.
- **`content.js`** → a `CONTENT` object: every on-screen string and the lesson
  list. All copy lives here.
- **`theme.css`** → the whole look. Loads *after* `base.css` and paints on top,
  so you can override appearance without touching the skeleton.

---

## How to add a new persona

1. Copy `personas/elders/` to `personas/<your-persona>/`.
2. Edit the three files: rewrite the copy in `content.js`, retune `config.js`,
   restyle `theme.css`. (Different fonts? Update the `--font-*` tokens in
   `theme.css` **and** the Google Fonts `<link>` in `index.html`.)
3. Point `index.html` at your folder instead of `elders/` — the three
   `personas/elders/...` references in the `<link>` and `<script>` tags.
4. You should not need to open `app.js` or `base.css` to do any of this.

(If the personas become separately deployed sites, each can have its own
`index.html` pointing at its own folder. For now there is one.)

---

## Instructions for AI assistants

- If asked to change **wording, look, colours, fonts, or gesture feel**, edit
  **only** the relevant `personas/<name>/` file (`content.js`, `theme.css`, or
  `config.js`). **Do not** edit `app.js` or `base.css` to accomplish this.
- If a request seems to require an engine change (`app.js`/`base.css`), **say
  so explicitly** and flag that it affects every persona, before doing it.
- Keep the seam clean: no persona-specific strings, colours, or tuning numbers
  belong in `app.js` or `base.css`.
- `config.js`/`content.js` define **globals** (`CONFIG`, `CONTENT`) loaded as
  plain `<script>`s before `app.js`; `theme.css` loads after `base.css`. Keep
  that load order if you touch `index.html`.

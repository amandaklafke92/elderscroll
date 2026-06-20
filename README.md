# ElderScroll — Onboarding MVP

A localhost web app that teaches "technology" through body movements, captured by
your laptop camera and read with **MediaPipe Pose Landmarker** in the browser.
Built for the Terrible Ideas Hackathon — the absurd bits are intentional.

This is the **onboarding flow only**: Lesson 1 (clap = click) and Lesson 2
(lean = toggle between buttons), then the lesson library unlocks.

Pure static app. No React, no Node, no Python, no backend, no database.
Just `index.html`, `style.css`, `app.js`, and `assets/tutorials/`.

---

## How to run it

You need a tiny local web server (the camera and MediaPipe only work over
`localhost`, not by double-clicking the file). This command uses Ruby, which
already ships with macOS — it is **not** part of the app, just a file server.

From this folder, run:

```
ruby -run -e httpd . -p 8000
```

Then open **Google Chrome** and go to:

```
http://localhost:8000/
```

Click **Start**, allow the camera when asked, and the flow begins.
Press `Ctrl + C` in the terminal to stop the server when you're done.

> Tip: use **Chrome** (best camera + MediaPipe support). The first load fetches
> the detection model from a CDN, so you need internet and it can take ~10s once.

---

## The flow (exactly what happens)

1. **Lesson 1 tutorial** — two tutorial slots (finger-on-phone, then body).
   Missing videos show a placeholder and auto-advance. → practice.
2. **Lesson 1 practice** — live camera; `next` button just right of centre,
   pre-selected (yellow border). **Clap** to press it.
3. **Success** — confetti (~3s) → Lesson 2 tutorial.
4. **Lesson 2 tutorial** — same two-slot pattern → practice.
5. **Lesson 2 practice** — adds the "bad" button just left of centre
   (*"Wire my pension to a handsome prince."*), pre-selected. **Lean right**
   to move the yellow border to `next`, then **clap**. The bad button is a decoy
   and does nothing.
6. **Success** — confetti (~3s) → lesson library.
7. **Lesson library** — *"Lean to move between lessons. Clap to start the one you
   want."* Lean to move the yellow border between cards, clap to start.

If a movement isn't detected, help text appears beginning
*"it's not working... try this..."* (no directional arrows, by design).

---

## Presenter keys (demo safety net)

Camera detection is the real path, but these keys always work so a live demo
can't stall. They do the same thing as the gestures:

| Key        | Acts as |
|------------|---------|
| `Space`    | clap    |
| `→` / `←`  | lean right / left |
| `d`        | toggle the debug readout (shows live detection numbers) |

---

## Tuning the detection

All thresholds live at the top of `app.js`:

- `CLAP_TOGETHER` / `CLAP_APART` — how close/far the wrists must get for a clap.
- `LEAN_ENTER` / `LEAN_EXIT` — how far you must lean.
- `LEAN_RIGHT_SIGN` — **if leaning reads reversed** (lean right selects the wrong
  button), change `-1` to `1`. That's the one knob for direction.

Press `d` while practising to watch the live numbers and dial these in.

---

## Tutorial videos

Drop MP4s (each < 30s) into `assets/tutorials/` with these names:
`lesson1-finger.mp4`, `lesson1-body.mp4`, `lesson2-finger.mp4`, `lesson2-body.mp4`.
See `assets/tutorials/README.txt`. Without them the flow still runs via placeholders.

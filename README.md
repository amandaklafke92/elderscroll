# ElderScroll

A localhost hackathon app that disguises dance-move recording as technology lessons.
MediaPipe detects five body gestures in the browser. Each lesson has two practice
rounds; only Practice 2 is recorded.

At the end, the five clips are rendered into one reel, downloaded locally, uploaded
to the Lovable video library, and shown with a participant-specific download link.

## Run it

Open two terminal windows in this folder.

Terminal 1 — serve the app:

```sh
ruby -run -e httpd . -p 8000
```

Terminal 2 — run the Lovable upload bridge:

```sh
LOVABLE_ADMIN_PASSCODE="your-passcode" node upload-helper.mjs
```

Use the admin passcode configured in the Lovable project. Keep it local; do not
commit it to GitHub.

Then open Chrome at:

```text
http://localhost:8000/
```

Do not open `index.html` directly with a `file://` URL. Camera access and browser
modules require localhost.

## Flow

1. Start the camera and enter the participant's name.
2. Watch the intro.
3. Complete five lessons: Click, Move, Zoom In, Zoom Out, and Take a Photo.
4. Each lesson runs tutorial → Practice 1 → Practice 2.
5. Practice 2 is recorded silently.
6. After the final lesson, a short gift message appears.
7. The clips render in lesson order and automatically play.
8. A local copy downloads and the Lovable download link appears.

## Presenter controls

- `Space` — perform the gesture expected by the current practice screen.
- `S` — testing only: skip the current video, countdown, practice, or feedback screen.
- `R` — testing only: record a five-second clip.
- `P` — testing only: render and preview all clips recorded so far.
- `d` — toggle gesture-debug values.
- `i` — invert the reveal segmentation mask if the foreground/background is reversed.

Remove the `S`, `R`, and `P` testing controls and the visible test-recording status
before the final public demo.

## Important files

- `app.js` — gesture detection, lesson flow, recording, reel rendering, and upload.
- `personas/elders/content.js` — lesson order, copy, and gesture mappings.
- `personas/elders/config.js` — gesture thresholds, timing, and upload settings.
- `upload-helper.mjs` — local bridge to the Lovable upload endpoint.
- `Videos/` — intro and lesson tutorial videos.
- `assets/background-beat-it.jpeg` — optional reveal background.

Chrome is recommended. The first run requires internet access to download MediaPipe
models. If background segmentation fails, reel creation continues with the real
camera background.

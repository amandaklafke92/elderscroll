# ElderScroll — Product Requirements Document

**Gesture-Based Technology Tutorial for Elderly Users**
Status: Onboarding-flow MVP · Build target: localhost (laptop)

---

## 1. Product Overview

**ElderScroll** is a localhost web application that teaches elderly people how to use technology through simple body movements. Rather than tapping, swiping, or typing, the user controls the interface using their body and hands, captured by the laptop's camera and interpreted via computer-vision movement detection.

ElderScroll is structured as a series of lessons (skills). Each lesson follows a fixed pattern: the user watches two tutorial videos, practises the movement using a live camera view of themselves, receives a success state when they perform it correctly, and then progresses. After the first two onboarding lessons are completed, a lesson/skill library becomes available for selecting further lessons.

**This PRD covers the onboarding flow only** — the first two lessons (clap, lean). Additional movement skills and the full lesson-library navigation will be specified in a later PRD.

---

## 2. Product Goal

Teach elderly users how to operate technology by mapping physical body movements (claps, leans) to standard digital interactions (clicking, toggling between buttons), reinforced through video tutorials, live practice, error correction, and success feedback.

---

## 3. Hackathon Context

ElderScroll is being built for a **Terrible Ideas Hackathon**. The terrible idea is the point.

- The intentionally bad, absurd, uncomfortable, and fear-based parts of the experience are **deliberate** and must be preserved.
- The specification includes a "bad" button that plays on elderly users' fears of technology, labelled **"Wire my pension to a handsome prince."** This is intentional and must remain in the build.
- Apparent bad UX is expected. It is documented here without modification.

---

## 4. Technical Context

The MVP will be built using:

- **MediaPipe**
- **Computer vision / CV-based movement detection**
- **AI-assisted development** (ChatGPT, Claude Code, Cursor, Windsurf, Lovable, Bolt, Replit, or similar)
- **Localhost development environment**

The engineer runs the MVP locally. **Target device: laptop.** No cloud services, authentication, databases, third-party APIs, or production infrastructure are required. The interface uses the laptop's camera as a live video source during practice screens.

Camera-permission, denial, and no-camera fallback handling are **out of scope** — the existing MVP already bypasses/resolves these.

---

## 5. Core Concept

ElderScroll replaces conventional touch/click input with **body-movement input** detected by computer vision:

- **Clap = click** (selecting/pressing a button)
- **Lean = toggle** (moving the selection between buttons)

Each lesson teaches one such movement-to-interaction mapping, delivered in a repeating four-stage structure (tutorial → practice → success → next), with a skill-selection library unlocking after onboarding.

---

## 6. Target Audience

Elderly people learning how to use technology.

---

## 7. User Journey

ElderScroll delivers a sequence of lessons. The first two lessons (**clapping** and **leaning**) constitute onboarding. The lesson/skill library only appears **after** these two onboarding lessons are completed.

The two onboarding practice screens are **near-identical** by design. They share one layout; the only difference is that Skill 2 adds the "bad" button. Button positions are fixed so the layout does not shift between the two lessons.

### Skill 1: Clap = Clicking

1. **Tutorial** — User watches the two tutorial videos. The next page loads automatically.
2. **User practice** — Goal: the user must click/clap on a button labelled **"next"**.
   - The "next" button appears **just to the right of center**.
   - The "next" button has a **highlighted/selected state** (yellow border).
   - When the user successfully claps on the button, the success page appears for **3 seconds**, before the next skill's tutorial page automatically loads.

### Skill 2: Leaning = Toggle Between Buttons

1. **Tutorial** — As above (two tutorial videos; next page loads automatically).
2. **User practice** — Goal: the user must select the **"next"** button to progress to the success screen.
   - The screen is the same as Skill 1, plus an **additional "bad" button** labelled **"Wire my pension to a handsome prince."**
   - The **"bad" button** appears **just to the left of center**; the **"next" button** remains **just to the right of center**. The two buttons flank the center, appearing **side by side and clearly visible together**.
   - The **"bad" button is already pre-selected**, indicated by a **yellow border**.
   - The user must **lean to the right** to change the selection to the **"next"** button, and then **clap their hands to click**.
   - Instruction text indicates what the user should do (e.g. "lean right").
   - **No visual cue.**
3. **Success screen** appears.
4. **Lesson/skills library** appears.

---

## 8. Onboarding Flow

Onboarding consists of the **first two lessons**, completed in order:

1. **Lesson 1 — Clapping** (clap = clicking)
2. **Lesson 2 — Leaning** (lean = toggle between buttons)

The lesson/skill library screen (Page 4) **only appears after the user has completed both onboarding lessons.**

---

## 9. Screen Specifications

### Page 1 — Tutorial

- The user watches **two video tutorials** on screen.
- **First tutorial:** a video of a person performing the movement **using their fingers on a phone**.
- **Second tutorial:** a video of a person performing the movement **with their body**.
- After the tutorials play, the **practice page automatically loads**.
- **Video assets:** provided later by the team; **< 30 seconds each, likely MP4.**

### Page 2 — User Practice

- The interface becomes the **laptop camera as live video**, so the user can see themselves performing the movement.
- **Short instructional text** tells the user what they need to do.
- **Shared button layout (both onboarding skills):**
  - **"next" button** — just to the **right of center**, with a highlighted/selected state (yellow border).
  - **"bad" button** (Skill 2 only) — just to the **left of center**, pre-selected with a yellow border on load.
- **If the user is successful**, they move to **Page 3**.
- **If the user is unsuccessful**, help/error text appears with additional instructions, beginning with:
  > "it's not working... try this..."
- **No directional visual cues** are shown in error states (removed).

### Page 3 — Success Screen

- A success screen indicates the user has performed the motion successfully.
- **Confetti appears for approximately 3 seconds**, before moving onto the next movement skill.

### Page 4 — Skill/Lesson Selection

- The page shows the **complete lesson/skill library** in the app.
- **Instruction text at the top:**
  > **"Lean to move between lessons. Clap to start the one you want."**
- **Note:** This screen only appears after onboarding (the first two lessons: clapping and leaning) is complete.
- Detailed library navigation behavior (entering/returning from a lesson) is specified in a later PRD.

---

## 10. Interaction Requirements

| Interaction | Movement | Effect |
|---|---|---|
| Click / select a button | **Clap** | Presses the currently selected button |
| Toggle between buttons | **Lean** | Moves the active selection from one button to another |
| Toggle between lessons (Page 4) | **Lean** | Moves between lessons in the library |
| Select a lesson (Page 4) | **Clap** | Confirms/starts the lesson the user is currently on |

**Selection indicator:** the currently selected button/lesson is indicated by a **yellow border**.

---

## 11. Functional Requirements

1. **Tutorial playback:** Each lesson begins with two tutorial videos (finger-on-phone, then body movement) played on screen.
2. **Automatic transition (tutorial → practice):** After the tutorial videos play, the practice page loads automatically.
3. **Live camera practice:** The practice screen displays the laptop camera as live video so the user sees themselves.
4. **Instructional text:** The practice screen displays short instructional text telling the user what to do (e.g. "lean right").
5. **Shared onboarding layout:** Skill 1 and Skill 2 practice screens use the same layout — "next" just right of center, "bad" button (Skill 2 only) just left of center.
6. **Success transition:** On successful movement detection, the app advances to the success screen.
7. **Success screen + confetti:** The success screen shows confetti for ~3 seconds, then automatically loads the next skill's tutorial page (or, after onboarding completes, the lesson/skill library).
8. **Error handling:** On unsuccessful attempts, help/error text appears beginning with "it's not working... try this..." No directional visual cues.
9. **Onboarding gate:** The lesson/skill library (Page 4) only appears after both onboarding lessons (clapping, leaning) are completed.
10. **Lesson library display:** Page 4 displays the complete lesson/skill library with the concise instruction text at the top.
11. **"Bad" button (Skill 2):** A second button labelled "Wire my pension to a handsome prince" appears just left of center, pre-selected with a yellow border. It is a **visible UI label/decoy only** and performs no real external action.

---

## 12. Movement Detection Requirements

Implemented via **MediaPipe** and CV-based movement detection.

1. **Clap detection** — Detects a clap to register a "click" on the currently selected button.
2. **Clap position is meaningful** — The user exists within the same interface they interact with, so a clap's on-screen location is spatially significant; detection associates the clap with the button it lands on/near.
3. **Lean detection** — Detects a lean (direction-aware; e.g. **lean right**) to toggle the active selection between buttons (and between lessons on Page 4).
4. **Success recognition** — On detecting the correct movement for the current lesson goal, the app triggers the success state.

Detection thresholds and timing are left to implementation; the existing MediaPipe/CV stack and MVP already handle recognition.

### Per-lesson detection mapping

- **Skill 1 (Clap = Clicking):** Detect a clap on the "next" button (just right of center). On success → success screen.
- **Skill 2 (Leaning = Toggle):** Detect a **lean right** to move selection from the pre-selected "bad" button to the "next" button, then detect a **clap** to click "next." On success → success screen.

---

## 13. Success States

1. **Practice success:** The user performs the correct movement → the success screen appears.
2. **Success screen behavior:** Confetti displays for approximately **3 seconds**.
3. **Post-success transition:** After the confetti, the app automatically loads the **next movement skill's tutorial page** (or, after onboarding completes, the lesson/skill library).

---

## 14. Error States

1. **Trigger:** The user attempts the movement on the practice screen but is unsuccessful.
2. **Error text:** Help/error text appears, beginning with the exact phrase:
   > "it's not working... try this..."
   followed by additional instructions.
3. **No visual cues.**

---

## 15. Navigation Rules

1. **Tutorial → Practice:** Automatic, after the two tutorial videos play.
2. **Practice → Success:** On successful movement detection.
3. **Practice (unsuccessful):** Remains on the practice screen; error text is shown (no visual cues).
4. **Success → Next:** After ~3 seconds of confetti, automatically loads the next skill's tutorial page.
5. **Onboarding → Library:** The lesson/skill library (Page 4) appears only after both onboarding lessons (clapping, leaning) are completed. In Skill 2's flow, the success screen is followed by the lesson/skills library.
6. **Within Library (Page 4):** Lean to move between lessons; clap to start the lesson the user is on. (Detailed entry/return behavior: later PRD.)

---

## 16. Component Inventory by Screen

### Page 1 — Tutorial
- Video player — Tutorial Video 1 (finger-on-phone movement)
- Video player — Tutorial Video 2 (body movement)
- Auto-advance handler (to practice screen)

### Page 2 — User Practice
- Live camera video view (laptop camera)
- Short instructional text
- "next" button — just right of center, highlighted state (yellow border)
- "bad" button (Skill 2 only) — just left of center, pre-selected (yellow border), label "Wire my pension to a handsome prince"
- Error/help text component (starting "it's not working... try this...")
- Movement detection (MediaPipe / CV): clap and lean

### Page 3 — Success Screen
- Success indicator
- Confetti animation (~3 seconds)
- Auto-advance handler (to next skill tutorial / library)

### Page 4 — Skill/Lesson Selection
- Concise instruction text (top): "Lean to move between lessons. Clap to start the one you want."
- Complete lesson/skill library display
- Selection indicator (yellow border)
- Movement detection: lean (toggle between lessons), clap (select lesson)

---

## 17. Acceptance Criteria

1. Page 1 plays two tutorial videos in order: (1) finger-on-phone movement, (2) body movement, then automatically loads Page 2.
2. Page 2 displays the laptop camera as live video plus short instructional text describing the required movement.
3. **Skill 1:** A "next" button appears just to the right of center, with a yellow-border highlighted state. A successful clap on it triggers the success screen.
4. The success screen displays confetti for approximately 3 seconds, then automatically loads the next skill's tutorial page.
5. On an unsuccessful attempt, help/error text appears beginning with "it's not working... try this...", with no visual cues.
6. **Skill 2:** On load, the "bad" button ("Wire my pension to a handsome prince") appears just to the left of center and is pre-selected with a yellow border; the "next" button remains just to the right of center; both buttons are clearly visible side by side.
7. **Skill 2:** Leaning right moves the selection from the "bad" button to the "next" button; a subsequent clap clicks "next" and advances to the success screen.
8. The "bad" button is a visible UI label/decoy only and performs no real external action.
9. The lesson/skill library (Page 4) appears only after both onboarding lessons (clapping, leaning) are completed.
10. Page 4 displays the complete lesson/skill library with the instruction text "Lean to move between lessons. Clap to start the one you want."
11. On Page 4, leaning moves between lessons and clapping starts the lesson the user is on.

---

## 18. Out of Scope (this PRD)

- Additional movement skills beyond clap and lean (future PRD; more skills planned).
- Detailed lesson-library navigation (entering a lesson, returning to the library).
- Camera-permission, denial, and no-camera fallback handling (already resolved by existing MVP).
- Tutorial video production (assets provided later; < 30s each, likely MP4).
- Movement-detection thresholds/timing tuning (handled by MediaPipe/CV stack).

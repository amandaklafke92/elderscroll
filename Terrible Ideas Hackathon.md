[https://chatgpt.com/share/6a357582-e6e0-83e8-966e-3c4eefdaee5e](https://chatgpt.com/share/6a357582-e6e0-83e8-966e-3c4eefdaee5e)

# ElderScrolls

*A computer vision interface that turns basic screen navigation into mandatory exercise.*

MVP: A polished web app where your hand moves an on-screen cursor and clapping clicks oversized buttons, presented as a terrible accessibility/productivity innovation.  
\---

\# Project overview

The project is a deliberately bad accessibility interface for the \*\*Terrible Ideas Hackathon\*\*.

Working title:

\> \*\*ElderScrolls\*\*

The joke is that instead of using a mouse or touchscreen, you control a computer using exaggerated body movements.

Although it's a "terrible idea", the implementation should actually work reasonably well.

The team intentionally shifted from "old people exercising" to "general body-controlled computer interaction", because it is easier to demo and technically much more interesting.

\---

\# Overall architecture

The agreed architecture is:

\`\`\`text  
Webcam  
        ↓  
MediaPipe Pose Detection  
        ↓  
Gesture Recognition (our own code)  
        ↓  
Action Mapping  
        ↓  
Either:

1\. Webpage controls  
or

2\. Desktop mouse/keyboard controls  
\`\`\`

Important distinction:

\*\*MediaPipe does NOT know what a clap is.\*\*

It only outputs body landmarks.

Example:

\`\`\`text  
left wrist  
right wrist  
shoulders  
nose  
hips  
...  
\`\`\`

Our own code decides:

\`\`\`text  
hands close together  
→ clap

lean left  
→ left gesture

hands above head  
→ scroll up  
\`\`\`

\---

\# Stage 1 (completed)

A browser-based proof of concept.

This was chosen because:

\- easiest to build  
\- safest  
\- easiest to debug  
\- no operating-system permissions required

It uses:

\- webcam  
\- MediaPipe  
\- fake webpage

The webpage reacts to gestures only.

Nothing outside the webpage is controlled.

\---

\# Gestures that were implemented

The original standing version included things like squats.

That was abandoned.

Instead the project switched to \*\*seated gestures\*\* because they are:

\- easier  
\- safer  
\- faster to test  
\- require less camera space

Current seated mappings became:

| Gesture | Action |  
|---------|---------|  
| Lean forward | Scroll down |  
| Raise both hands | Scroll up |  
| Lean left | Previous |  
| Lean right | Next |  
| Clap | Click |  
| Mini T-pose | Emergency stop |

\---

\# Stage 2

Once the webpage worked, the next goal became:

\> Can we control the desktop instead of only our webpage?

Instead of

\`\`\`text  
gesture  
→ webpage scrolls  
\`\`\`

we now want

\`\`\`text  
gesture  
→ mouse  
→ keyboard  
→ active application  
\`\`\`

That allows controlling:

\- Chrome  
\- YouTube  
\- PowerPoint  
\- basically anything

\---

\# Desktop architecture

Desktop version became:

\`\`\`text  
OpenCV  
↓  
MediaPipe  
↓  
Python  
↓  
PyAutoGUI  
↓  
Mouse \+ Keyboard  
\`\`\`

Where:

OpenCV

\- reads webcam

MediaPipe

\- detects pose

Python

\- recognises gestures

PyAutoGUI

\- presses keys  
\- scrolls  
\- moves mouse  
\- clicks

\---

\# Initial desktop profiles

Originally there were three profiles.

\#\#\# YouTube

Clap

↓

Space

Lean left

↓

Left Arrow

Lean right

↓

Right Arrow

Forward lean

↓

Scroll

\---

\#\#\# Browser

Similar but using browser shortcuts.

\---

\#\#\# Mouse

Very primitive.

Instead of following your hand it only moved:

\`\`\`text  
lean left

↓

move mouse left 120 pixels  
\`\`\`

This was considered unsatisfying.

\---

\# Major design decision

This became the biggest decision of the conversation.

Instead of:

\`\`\`text  
gesture

↓

move cursor left  
\`\`\`

the team decided:

\> \*\*The hand itself should continuously control the cursor.\*\*

Essentially:

\`\`\`text  
right hand

↓

cursor  
\`\`\`

Then

\`\`\`text  
clap

↓

click  
\`\`\`

This became the preferred demo.

\---

\# AirMouse mode

A completely new profile was designed.

Called:

\`\`\`text  
airmouse  
\`\`\`

Behaviour:

| Motion | Action |  
|---------|--------|  
| Right hand | Cursor |  
| Clap | Left click |  
| Mini T-pose | Emergency stop |  
| C | Calibrate |  
| G | Arm |  
| Esc | Disarm |

Nothing else.

No leaning.

No scrolling.

No left/right gestures.

Just:

\`\`\`text  
hand

↓

cursor  
\`\`\`

This was considered much cleaner.

\---

\# Calibration

Calibration became an important design choice.

When pressing:

\`\`\`text  
C  
\`\`\`

the software stores:

\- shoulder centre  
\- shoulder width  
\- shoulder height

Then the cursor movement is relative to that body position.

Without calibration, cursor mapping becomes unstable whenever the user shifts position.

\---

\# Safety decisions

Several deliberate safety mechanisms were added.

The system starts:

\`\`\`text  
DISARMED  
\`\`\`

User must press:

\`\`\`text  
G  
\`\`\`

before gestures do anything.

Emergency stops:

\- Esc  
\- Mini T-pose  
\- Q  
\- Ctrl+Alt+Q  
\- PyAutoGUI failsafe

\---

\# Technology decisions

Originally:

Old MediaPipe API

\`\`\`python  
mp.solutions.pose  
\`\`\`

This caused version problems.

The project switched to:

New MediaPipe Tasks API

using

\`\`\`text  
PoseLandmarker  
\`\`\`

This avoids depending on older MediaPipe versions.

\---

\# Development environment

Decision:

Everything should run inside VS Code.

No special IDE.

Project structure:

\`\`\`text  
project/

desktop\_controller\_tasks.py

requirements.txt

README.md

.venv/  
\`\`\`

Important understanding:

\`.venv\` is only the Python environment.

It should never be edited.

Only:

\`\`\`text  
desktop\_controller\_tasks.py  
\`\`\`

gets replaced.

\---

\# What was intentionally NOT done

Several ideas were discussed but deliberately postponed.

\#\# Not full body tracking

Originally:

\- squats  
\- standing  
\- walking

These were abandoned.

Reason:

too hard  
too unreliable  
too slow to demo

\---

\#\# Not YOLO

A teammate mentioned:

\`\`\`text  
YOLO  
\`\`\`

This was discussed but never adopted.

Decision:

MediaPipe Pose is sufficient.

YOLO adds unnecessary complexity.

\---

\#\# Not cursor-slaving immediately

Originally the idea was:

\`\`\`text  
pose

↓

cursor  
\`\`\`

across the entire desktop.

Instead the project first built:

\`\`\`text  
pose

↓

fake webpage  
\`\`\`

to prove the concept.

Only afterwards moved to desktop control.

\---

\#\# Not arbitrary desktop automation

The team intentionally avoided trying to control every application immediately.

Instead they created profiles:

\- YouTube  
\- Browser  
\- Mouse  
\- AirMouse

Each profile has predictable mappings.

\---

\#\# Not gesture overload

There was discussion of adding many gestures.

Instead the decision became:

Keep the number of gestures small.

Especially in AirMouse mode.

Final idea:

\`\`\`text  
hand

↓

cursor

clap

↓

click  
\`\`\`

Everything else should disappear.

\---

\# Current direction

The current vision is:

\`\`\`text  
Sit in front of webcam

↓

Press C

↓

Press G

↓

Move hand

↓

Cursor follows hand

↓

Clap

↓

Click  
\`\`\`

This is now considered the flagship demo.

\---

\# Future ideas (not implemented yet)

If more time remains during the hackathon, these are the natural next steps:

1\. Better cursor smoothing (reduce jitter).  
2\. Adaptive calibration (automatically recentre if the user shifts slightly).  
3\. Click-and-drag gesture.  
4\. Two-hand gestures (e.g. pinch to zoom).  
5\. Different profiles for PowerPoint, YouTube, browser, etc.  
6\. Better gesture confidence using multiple consecutive frames before triggering actions.

\---

\# Current project status

\*\*Completed\*\*  
\- Browser prototype.  
\- Seated gesture recognition.  
\- Desktop control architecture.  
\- New MediaPipe Tasks API migration.  
\- AirMouse design.  
\- Full replacement AirMouse controller produced.

\*\*Current focus\*\*  
\- Get AirMouse working reliably:  
  \- Right hand → cursor.  
  \- Clap → click.  
  \- Tune smoothing and sensitivity until it feels natural.

That is the agreed direction for the remainder of the hackathon.


---
doc: scope
status: approved
---

# Paperclear — Japanese Document Action Reader

A desktop app that reads a photo of an official Japanese document and tells you what to do, by when, and how — in plain language.

## The Unique Kernel

Translation apps translate text. This app tells you what to **do**. It takes a dense, bureaucratic Japanese document and extracts the one thing the reader actually needs: a 3-line action instruction with the deadline made impossible to miss. The output isn't a reading — it's a to-do.

## Who It's For

A foreign resident in Japan who receives an envelope from the city hall, opens it, sees dense official Japanese, and has no idea what is being asked of them or when. They know how to use a smartphone and want to handle the document now, not later. Today they either struggle through it word by word, ask someone for help, or ignore it until a reminder arrives.

Also: an adult child who helps an elderly parent manage paperwork but isn't always nearby.

## The Core Loop

They photograph the document, drop the photo into the app, and within a few seconds see: the deadline large at the top, three lines telling them what to do, by when, and exactly how — and a button to switch the same output between plain Japanese and English.

## Inspiration & Identity

Calm and reassuring, not clinical. The feeling of having a knowledgeable friend look at the document and say "don't worry, here's what you need to do." Fast and clear over beautiful. Confidence-building, not overwhelming.

**Design direction (learner-specified):**

- **Theme:** "A paper document, neatly sorted out." Calm and trustworthy — not sterile or tech-flashy.
- **Color palette:** Warm off-white (washi paper) background. Ink-black body text. A single accent color: vermilion (朱色) — used only for the deadline, like a red stamp or urgent sticky note.
- **Deadline display:** The largest element on screen, rendered in vermilion to stand out like a hanko seal or warning tag.
- **Typography:** Mincho (serif) for headings; clean Gothic (sans-serif) for body text.
- **Animation:** When a photo is processed, the 3 action lines appear one by one in sequence — not all at once.
- **Spacing:** Generous whitespace throughout; never pack information into a single screen.
- **Avoid:** Purple gradients, generic template aesthetics, anything that looks like a dashboard boilerplate.

## Why This Matters to the Learner

A real, recurring problem: official documents cause genuine anxiety and missed deadlines for people who don't read formal Japanese fluently. The learner wants to build something with practical value beyond the hackathon, and to demonstrate that an AI-powered tool can take something overwhelming and make it immediately actionable.

## What "Working" Looks Like

The learner loads a fictional city-hall document into the app. Within seconds:

- The deadline appears large at the top: "10月31日まで（あと23日）"
- Three action lines appear beneath it: what / by when / how
- A toggle switches the same output between plain Japanese and English
- The original document photo is visible alongside the result

Edge cases handled gracefully: if no deadline is found, "期限は見つかりませんでした" is shown. If the image isn't a recognizable document, "書類を読み取れませんでした" is shown.

That last moment — watching a wall of bureaucratic text collapse into three clear lines — is the "oh, that's useful" beat.

## The POC Boundary

- **In:** Photo input, Gemini API call, 3-line action summary (what / by when / how), deadline display, plain Japanese / English language toggle, graceful error states for no-deadline and non-document images.
- **Demo documents:** Fictional only. No real personal information.
- **API key:** Stored in a separate local file, never committed to the repository.

## Later

- Support for other document types (tax notices, school forms, medical paperwork)
- Copy-to-clipboard for the summary
- History of previously scanned documents
- Mobile version

## Explicitly Cut

- **Document storage and sharing:** Not needed to prove the core loop; adds complexity and privacy concerns.
- **User accounts:** No login required for a local desktop tool.
- **Application filing / form-filling:** Out of scope — this reads, it does not act.
- **Legal or tax advice:** The app summarizes procedures, not legal obligations.

---
doc: prd
status: approved
---

# Paperclear — Product Requirements

A desktop app for foreign residents in Japan (and family members helping elderly parents) that reads a photo of an official Japanese document and returns a 3-line action instruction with the deadline made unmissable.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`

---

## The Core Journey

1. **First launch only — API key setup.** The user sees the API Key Setup Screen before anything else. They enter their Gemini API key, verify it with a test call, and save it locally. On success, the app proceeds to the Initial Screen. On failure, they stay on the setup screen with an error message.
2. **Initial Screen.** The user sees a large centered drop zone with an illustration and a brief guide in their chosen language. They can drag a photo onto the drop zone or click "写真を選ぶ / Choose photo" to open a file picker.
3. **Processing.** The layout splits into left (photo) and right (result area). A scanning animation plays over the photo. The right side shows "書類を読んでいます… / Reading document…" and three placeholder lines.
4. **Results.** The deadline appears large in vermilion at the top of the right panel. The three action lines appear one by one in sequence. The photo remains visible on the left for comparison.
5. **Language switch.** At any point the user can toggle between やさしい日本語 and English; the display updates instantly without re-reading the document.
6. **Next document.** The user clicks "別の書類を読む / Read another document" and returns to the Initial Screen.

---

## Screens and Layout

### API Key Setup Screen (first launch only)
- Displayed once, before the Initial Screen, when no saved key is found.
- Contains: short explanation, masked text input with show/hide toggle (eye icon), "鍵の取得方法を見る / How to get a key" link (opens Google's official API key page in the system browser), and "保存して始める / Save and start" button.
- On save: runs a short validation call to Gemini. Success → navigate to Initial Screen. Failure → inline error message, stay on screen.
- The key is saved to local device storage only, never written to the project folder or repo.

### Initial Screen
- App name and logo: top-left, small.
- Language toggle (やさしい日本語 / English): top-right.
- Settings gear icon: top-left area (near logo), small and unobtrusive.
- Drop zone: centered, large. Contains an envelope/document illustration and a two-line guide:
  - JP: 「役所や学校から届いた書類の写真を入れると、何を・いつまでに・どうすればいいかを3行でお伝えします」
  - EN: "Drop a photo of an official document and get 3-line action instructions — what to do, by when, and how."
- "写真を選ぶ / Choose photo" button and "カメラで撮る / Use camera" button side by side below the drop zone.
- No other menus or settings visible.

### Camera Screen

Reached by tapping "カメラで撮る / Use camera" on the Initial Screen.

**Live viewfinder mode:**
- Full-height camera viewfinder with the document centered in frame.
- "撮影 / Capture" button centered at the bottom.
- "キャンセル / Cancel" link returns to the Initial Screen and stops the camera.
- Resolution requested: as high as the device supports (ideal 4K, falls back to what is available).

**Review mode** (after capture):
- The captured still fills the same area.
- Two buttons: "撮り直す / Retake" (returns to live viewfinder) and "これで読む / Use this" (proceeds to Processing, same flow as file picker).

**Camera error state:**
- If the user denies permission: "カメラの使用が許可されていません。システムの設定でカメラを許可してください / Camera access was not allowed. Please allow it in your system settings."
- If no camera is found: "カメラが見つかりませんでした / No camera found."
- If the camera is in use by another app: "カメラを起動できませんでした。他のアプリがカメラを使用中の可能性があります / Could not start camera. Another app may be using it."
- All error states show a "戻る / Back" button to return to the Initial Screen.

### Processing Screen (transition state)
- Left panel: the uploaded photo, full height.
- Right panel: "書類を読んでいます… / Reading document…" text + three placeholder lines (soft outlines indicating where results will appear).
- Scanning animation: a thin light line sweeps top-to-bottom over the left photo panel.
- Language toggle remains active top-right.

### Result Screen
- Left panel: uploaded photo (unchanged).
- Right panel:
  - **Deadline block** (top): large vermilion text, e.g. "10月31日まで（あと23日）" / "By October 31 (23 days left)"
  - **3-line action summary** (below deadline): lines appear one by one in sequence.
    - 何を / What: [action]
    - いつまでに / By when: [date]
    - どうやって / How: [method]
  - Language toggle: top-right, switches display instantly without re-reading.
  - "別の書類を読む / Read another document" button: bottom-right.

### Settings Screen (accessible from gear icon)
- Options: "鍵を変更する / Change key" and "鍵を削除する / Delete key".
- Deleting the key returns the user to the API Key Setup Screen on next launch.

---

## Look and Feel

Source: `scope.md > Inspiration & Identity`

- **Theme:** Calm and trustworthy. "A paper document, neatly sorted out." Not clinical or tech-flashy.
- **Background:** Warm off-white (washi paper tone).
- **Text:** Ink-black body text.
- **Accent color:** Vermilion (朱色) — used exclusively for the deadline display. Evokes a red hanko stamp or urgent sticky note.
- **Typography:** Mincho (serif) for headings and the app name; clean Gothic (sans-serif) for body text and instructions.
- **Animation:** Scanning line over the photo during processing. Result lines appear one-by-one in sequence (staggered reveal).
- **Spacing:** Generous whitespace; nothing cramped.
- **Avoid:** Purple gradients, generic AI-app dashboard aesthetics, boilerplate template look.

---

## Features and Behavior

### Document Reading
- Accepts photo files dropped onto the drop zone, selected via file picker, or captured with the in-app camera.
- Camera path: live viewfinder → capture still → review (use / retake) → send to Gemini.
- File picker and camera paths produce the same output and share the same Processing and Result screens.
- Sends the image to Gemini API and requests: deadline, what to do, by when, and how.
- Returns structured output (deadline + 3 lines) in both やさしい日本語 and English in a single API call, so the toggle never requires a second call.

### Language Toggle
- Switches between やさしい日本語 and English.
- Affects: guide text on Initial Screen, all labels and instructions, and the result content.
- Default language: Japanese (やさしい日本語).
- Toggle state is remembered for the current session; resets to Japanese on next launch.

### Deadline Display
- If a deadline is found: shown in large vermilion text with days-remaining count.
- If no deadline is found: shows "期限は見つかりませんでした / No deadline found" in the deadline area; the 3-line summary still displays whatever information is available.

### Settings
- Gear icon on Initial Screen opens the Settings Screen.
- User can change or delete their saved API key.

---

## States and Boundaries

- **First launch (no API key saved):** API Key Setup Screen appears before Initial Screen. User cannot proceed without a valid key.
- **Normal launch (key saved):** Proceeds directly to Initial Screen.
- **Processing:** Scanning animation plays; no input accepted until result or error is shown.
- **Result — success:** Deadline + 3 lines displayed as described.
- **Result — no deadline found:** "期限は見つかりませんでした" shown in deadline area; partial 3-line summary shown.
- **Result — non-document image:** Right panel shows "書類を読み取れませんでした / Could not read a document." + "別の写真を選ぶ / Choose a different photo" button. Left photo remains visible.
- **Result — network/API error:** Right panel shows "読み取りに失敗しました。もう一度お試しください / Reading failed. Please try again." + retry affordance.
- **Persistence:** API key saved locally between sessions. Language preference and document history are not persisted.

---

## Product Decisions

- **Single API call returns both languages.** Avoids a second network round-trip when the user toggles language. Decided for responsiveness.
- **No document history.** Keeps scope small and avoids storage/privacy complexity. Deferred to later.
- **Japanese as default language.** Target users are in Japan; Japanese is listed first in the toggle label.
- **Fictional demo documents only.** No real personal data used in testing or demo. Privacy protection.
- **API key stored locally only, never in the repo.** User stated this explicitly. The build will use a local config file excluded from git.
- **Gear icon for settings, not a menu.** Keeps the Initial Screen uncluttered.

---

## What We're Building

- API Key Setup Screen (first launch)
- Initial Screen with drop zone, file picker, language toggle, settings gear
- Processing state with scanning animation and placeholder lines
- Result Screen with deadline (vermilion), 3-line action summary (sequential reveal), language toggle, "Read another" button
- Error states: no deadline, non-document image, network/API failure
- Settings Screen: change key / delete key
- Design: washi palette, vermilion deadline, Mincho/Gothic typography, staggered animation

---

## Deferred From the POC

- **Document history:** Implied by "read another document" flow, but no list of past scans is stored or shown. Would require persistent local storage design.
- **Copy-to-clipboard:** Useful but not needed to prove the core loop.
- **Language preference persistence:** Toggle resets to Japanese on relaunch. Persisting it would require a settings store.

---

## Possible Later Enhancements

- Support for more document types: tax notices, school forms, medical paperwork.
- Copy-to-clipboard for the 3-line summary.
- History of previously scanned documents with search.
- Mobile version.

---

## Non-Goals

- **Document storage or sharing:** Not needed to prove the core loop; adds privacy complexity. (`scope.md > Explicitly Cut`)
- **User accounts or login:** Local desktop tool requires no authentication. (`scope.md > Explicitly Cut`)
- **Application filing or form-filling:** This app reads; it does not act. (`scope.md > Explicitly Cut`)
- **Legal or tax advice:** Summarizes procedures only, not legal obligations. (`scope.md > Explicitly Cut`)
- **Sending the API key to any third party:** The key is used only to call Google Gemini directly.

---

## Open Questions

- **Gemini model / endpoint:** Which specific Gemini model to use (e.g. gemini-1.5-flash, gemini-2.0-flash). Must be resolved before `4-spec`. The choice affects cost, speed, and image-reading capability.
- **"How to get a key" link URL:** The exact Google API Console URL for Gemini key creation. Can be confirmed at build time.
- **Local key storage mechanism:** Where exactly the key is stored on the user's machine (OS keychain, a local config file, etc.). A `4-spec` decision — it doesn't affect the user experience.
- **やさしい日本語 standard:** The app uses the plain-language Japanese style. The exact vocabulary guidelines (e.g. adhering to a formal やさしい日本語 standard vs. "plain and clear") can be specified in the Gemini prompt at build time.

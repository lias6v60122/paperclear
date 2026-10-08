---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

## Slices

- [x] **1. Running app — Gemini reads a document photo**
  Becomes usable: Electron window opens. You pick a photo, the app sends it to Gemini, and the raw JSON response appears on screen. No design yet — just proves the kernel works.
  Why now: Gemini image reading is the highest risk and the unique kernel. If it doesn't work, nothing else matters. Prove it on the first slice, with the full project scaffold included.
  PRD ref: `prd.md > Features and Behavior > Document Reading`
  Spec ref: `spec.md > Components`, `spec.md > File Structure`, `spec.md > External Services and Dependencies`
  Build: Scaffold the full project (package.json, main.js, preload.js, config.js, gemini.js, index.html, renderer.js, style.css basics). Load API key from a .env file in the project root using the `dotenv` package (never hardcoded, never committed). Add a "Choose Photo" button. On click: read the file, send to Gemini, display the raw JSON on screen.
  Verify (mechanical): Run `npm start` — window opens with no errors. Select a sample photo — JSON response appears on screen within ~10 seconds.
  Learner check: アプリを起動して、写真を1枚選んでください。画面にテキスト（JSONのデータ）が表示されれば成功です。
  Commit: `Scaffold project and prove Gemini image reading works`

- [x] **2. Full core loop — drop zone, loading, results, language toggle**
  Becomes usable: The complete Paperclear experience. Drop a photo → scanning animation → deadline in vermilion + 3-line summary appears one by one → language toggle switches JP/EN instantly → "Read another" returns to start.
  Why now: With the API proven, build the full UI in one slice so there's a complete, shippable loop to review and refine.
  PRD ref: `prd.md > Screens and Layout`, `prd.md > Look and Feel`, `prd.md > Features and Behavior`
  Spec ref: `spec.md > Components > Renderer — Main App`, `spec.md > Look and Feel`
  Build: Replace the test UI with: large drop zone (drag-and-drop + file picker), split-panel layout, scan animation over photo, result panel with vermilion deadline block + staggered 3-line reveal + JP/EN toggle + "Read another" button. Apply full washi design (colors, Noto fonts, spacing).
  Verify (mechanical): `npm start` → drop a photo → see split layout → scan animation plays → result appears with deadline in red + 3 lines one-by-one → toggle switches language → "Read another" resets to home.
  Learner check: 書類の写真を1枚ドロップしてください。期限が朱色で大きく表示され、3行が順番に現れたら成功です。言語切り替えボタンも押してみてください。
  Commit: `Add full UI: drop zone, scan animation, result display, language toggle`

- [x] **3. API key setup screen + settings**
  Becomes usable: No more hardcoded key. First launch shows the setup screen. Key is saved to AppData. Settings gear lets you change or delete the key.
  Why now: The app can't be shared or demoed safely with a hardcoded key. This completes the real security model from the spec.
  PRD ref: `prd.md > Screens and Layout > API Key Setup Screen`, `prd.md > Screens and Layout > Settings Screen`
  Spec ref: `spec.md > Components > Config Manager`, `spec.md > Components > Renderer — Setup Screen`
  Build: Add setup.html/setup.js with masked input, eye-icon toggle, validation call to Gemini, save to userData/config.json. Add settings gear to home screen, settings panel with "Change key" / "Delete key". Remove .env dependency.
  Verify (mechanical): Delete userData/config.json (or rename it), restart app — setup screen appears. Enter a valid key — proceeds to home. Enter a bad key — error message stays on screen. From home, open settings and delete key — next launch shows setup screen again.
  Learner check: アプリを起動してください。APIキーの入力画面が出たら、Geminiのキーを入力して「保存して始める」を押してみてください。ホーム画面に進んだら成功です。
  Commit: `Add API key setup screen and settings`

- [x] **4. Error states**
  Becomes usable: Every failure mode from the spec shows a clear, specific message instead of a broken or silent screen.
  Why now: Error handling is the last thing between a working prototype and a demo-ready product.
  PRD ref: `prd.md > States and Boundaries`
  Spec ref: `spec.md > Important Failure Modes`
  Build: (a) Non-document image: detect empty/null JSON fields → show "書類を読み取れませんでした". (b) Rate limit (HTTP 429): detect error code → show "利用回数の上限に達しました。少し待ってからお試しください". (c) Timeout/network error: catch other errors → show "読み取りに失敗しました。もう一度お試しください" + retry button. (d) No deadline found: show "期限は見つかりませんでした" in deadline area, still show available 3-line content.
  Verify (mechanical): (a) Drop a non-document photo (e.g. a selfie) — correct error message appears. (b) Simulate a 429 by temporarily patching the API call to throw a 429 error — correct rate-limit message appears. (c) Simulate a network error the same way — generic error + retry appears.
  Learner check: 書類ではない写真（風景や人物など）をアプリに入れてみてください。「書類を読み取れませんでした」と表示されれば成功です。
  Commit: `Add all error states`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after Slice 2 (full core loop working)
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [what actually happened; real document/test/code references; unfinished work if interrupted]
Route and stops: [actual paths and symbols; guided stops completed, or reference-only route]
Edit outcome: [tried/kept/reverted/declined/not applicable; verification if changed]
Reflection: [offered/answered/declined/already covered — personal answer belongs only in the ignored profile]
Activity mode: [live app and editor, explicit static fallback, focused alternative, prior practice, or recap]

## Revisions


# Pointly — Clicky-Style Cursor Companion (JavaScript)

Pointly is a lightweight, screen-aware desktop companion built in JavaScript (Node.js & Electron) powered by Google Gemini and Sarvam AI. Pointly lives as a tiny 26px Dark Red buddy beside your mouse cursor, providing hands-free push-to-talk voice guidance, Windows OS window controls (minimizing, maximizing, launching apps, pointing to window buttons), desktop file navigation, transient spoken affirmations, and silent text commands without popping open any large windows.

---

## Run

```powershell
npm install
npm run start:server
npm run dev
```

*(You can also run `npm run dev` directly).*

---

## Shortcuts & Controls

| Shortcut | Action | Description |
|---|---|---|
| **`Ctrl + Space`** | **Push-to-Talk** | Speak your command into the cursor companion. |
| **`Ctrl + E`** | **End Voice Session** | Immediately cancels voice recording, halts speech playback, and resets Pointly to idle. |
| **`Ctrl + T`** | **Toggle Text Command Bar** | Opens & focuses the micro typing capsule right where your cursor is (locks position in place so it doesn't move away). Press `Ctrl + T` again or `Esc` to close it. |
| **`Ctrl + Alt + Space`** | **Full Dashboard** | Opens the complete Pointly Chat Dashboard on demand. |

---

## Key Features

1. **Ultra-Compact 26px Dark Red Buddy (`#800a1e`)**:
   - Floats silently beside your cursor with animated expressive eyes.
   - 100% mouse click pass-through: never blocks your desktop clicks.
   - Dynamic states: **Idle**, **Listening** (crimson aura), **Thinking** (ruby spin), **Speaking** (talk pulse), and **Gliding**.

2. **Windows OS Window & Application Control**:
   - Say *"Where is minimize button / minimize Antigravity"*: Pointly glides its beacon to the top-right minimize button on screen, highlights it, speaks the affirmation, and minimizes the window!
   - Say *"Maximize Chrome"*, *"Show Desktop"*, or *"Open Notepad/Calculator"*: Pointly handles it immediately.

3. **Desktop File & Screen Awareness**:
   - Say or type *"Locate names.txt on my desktop"*: Pointly scans your desktop, glides across the screen to the file, reveals/highlights it in Windows Explorer, and speaks the confirmation aloud.

4. **Multi-Model Gemini & Sarvam Voice Engine**:
   - **Gemini AI**: High-speed conversational reasoning with automatic rate-limit cascade.
   - **Sarvam AI TTS (`bulbul:v3` & `bulbul:v2`)**: Voices including **Shubh**, **Anushka**, **Aditya**, **Priya**, and **Rohan** (`en-IN` & `hi-IN`).
   - **Sarvam AI STT (`saaras:v3`)**: 16kHz mono WAV recording for crystal-clear voice transcription.

5. **Persistent Local Memory**:
   - Saves conversations, speech logs, executed tasks, and visual screenshot snapshots in `userData/pointly_memory/`.

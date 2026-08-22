# Pointly PRD

Pointly is a Windows desktop assistant that combines a lightweight chat surface, a persistent cursor avatar, multimodal AI, voice input, and optional hands-free assist controls.

## Architecture

- `src/main`: Electron main process and privileged integrations.
- `src/preload`: narrow context-bridge APIs for each window.
- `src/renderer`: browser UI for chat, overlay, customization, and AirCanvas.
- `server`: local or deployed proxy that keeps provider keys off the desktop client.
- `landing-page`: static Windows download page.

## Local development

1. Run `npm install`.
2. Start the proxy with `npm run start:server`.
3. In another terminal, run `npm run dev`.
4. Press `Ctrl+Shift+Space` to toggle chat on Windows.

Provider calls, MediaPipe, and native input simulation are intentionally isolated behind their modules and need credentials/native dependencies before production use.

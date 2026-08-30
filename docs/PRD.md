# Pointly PRD

Pointly is a screen-aware, ambient AI desktop companion for Windows that combines an ultra-compact 26px cursor co-pilot, a multimodal chat dashboard, push-to-talk voice input via Sarvam AI, screen vision via Google Gemini, Chrome browser navigation, and native Windows OS automation.

## Architecture

- `src/main`: Electron main process, window management, hardware cursor tracking, OS & browser assist controllers, and IPC hub.
- `src/preload`: Secure context-bridge APIs for the overlay and chat dashboard windows.
- `src/renderer`: Renderer interfaces for the cursor companion overlay (`overlay/`) and the full dashboard (`chat/`).
- `server`: Local or deployed Express proxy server keeping AI provider credentials secure.
- `landing-page`: Modern showcase website and installer download portal.

## Local Development

1. Run `npm install`.
2. Start the proxy server: `npm run start:server`.
3. In another terminal, run `npm run dev`.
4. Use global shortcuts:
   - `Ctrl + Space`: Push-to-Talk Voice Command.
   - `Ctrl + E`: End Voice Session & cancel speech.
   - `Ctrl + T`: Toggle Text Command Capsule.
   - `Ctrl + Alt + Space`: Toggle Full Chat Dashboard.


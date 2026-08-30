# Pointly — Project Monorepo

<div align="center">

![Pointly Badge](https://img.shields.io/badge/Pointly-v0.1.0-800a1e?style=for-the-badge&logo=electron&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011-0078D6?style=for-the-badge&logo=windows&logoColor=white)
![Stack](https://img.shields.io/badge/Stack-Electron%20%7C%20Node.js%20%7C%20Gemini%20%7C%20Sarvam-4285F4?style=for-the-badge)

**The ambient, screen-aware AI desktop companion and web ecosystem for Windows.**

</div>

---

## 📂 Repository Structure

The Pointly repository is organized into two self-contained projects:

```
Pointly/
├── Pointly-Main/             # Electron Desktop Application (Windows Co-pilot)
│   ├── src/                  # Main, Preload & Renderer Overlay/Chat
│   ├── server/               # Express API Proxy Server (port 8787)
│   ├── docs/                 # Product Specifications & PRD
│   ├── package.json          # Desktop dependencies & scripts
│   └── README.md             # Desktop App Documentation
│
└── Pointly-Web/              # Interactive Showcase & Landing Page Web Portal
    ├── index.html            # Portal markup & in-browser cursor demo
    ├── style.css             # Glassmorphic dark design system
    ├── app.js                # Browser cursor physics & soundboard
    ├── firebase-config.js    # Firebase Google OAuth setup
    ├── package.json          # Dev server scripts (port 3000)
    └── README.md             # Web Portal Documentation
```

---

## 🚀 Quick Start Guide

### 1. Running the Desktop Application (`Pointly-Main`)

```powershell
cd Pointly-Main

# Install dependencies
npm install

# Start the Express proxy server
npm run start:server

# In another terminal, start the Electron Desktop App
npm run dev
```

*Shortcuts: `Ctrl + Space` (Voice Push-to-Talk), `Ctrl + T` (Typing Capsule), `Ctrl + Alt + Space` (Full Dashboard).*

👉 For full desktop architecture, see [Pointly-Main/README.md](file:///d:/Pointly/Pointly-Main/README.md).

---

### 2. Running the Showcase Web Portal (`Pointly-Web`)

```powershell
cd Pointly-Web

# Install local server dependencies
npm install

# Start the web preview server on http://localhost:3000
npm run dev
```

👉 For web portal architecture and deployment, see [Pointly-Web/README.md](file:///d:/Pointly/Pointly-Web/README.md).

---

<div align="center">
  <sub>Pointly Project · Built by Team XOR</sub>
</div>

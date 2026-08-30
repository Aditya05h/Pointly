# Pointly Web Portal — Official Interactive Showcase & Landing Page

<div align="center">

![Website Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Google%20OAuth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Design System](https://img.shields.io/badge/Theme-Dark%20Glassmorphism-800a1e?style=for-the-badge)
![Responsive](https://img.shields.io/badge/Mobile-100%25%20Responsive-blue?style=for-the-badge)

**The standalone interactive web portal and download showcase for Pointly — The Ambient AI Desktop Companion for Windows.**

[Quick Start](#-quick-start) • [Architecture](#-architecture--tech-stack) • [Interactive Features](#-interactive-features) • [Firebase Setup](#-firebase-authentication) • [Deployment](#-deployment-guide)

</div>

---

## 🌟 Overview

**Pointly-Web** is the official web showcase and distribution portal for the Pointly desktop application. Built with high-performance Vanilla web technologies, it features an in-browser simulation of the ambient cursor companion, an interactive voice and workflow showcase, Google OAuth authentication via Firebase, and direct distribution links for the Windows desktop installer (`Pointly-Setup.exe`).

---

## 🚀 Quick Start

### 1. Install Dependencies
```powershell
# Navigate into the web portal directory
cd Pointly-Web

# Install local server dependency (serve)
npm install
```

### 2. Run the Development Server
```powershell
npm run dev
```

Your browser will serve the portal at:
```
http://localhost:3000
```

*(You can also run `npm start` or double-click `index.html` directly in any modern browser).*

---

## 🏗️ Architecture & Tech Stack

```
┌──────────────────────────────────────────────────────────────┐
│                  POINTLY-WEB ARCHITECTURE                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────┐   ┌────────────────────────────────┐ │
│  │     index.html     │   │           style.css            │ │
│  │ • Semantic Layout  │   │ • CSS Variables & Tokens       │ │
│  │ • Meta & SEO Tags  │   │ • Glassmorphism Backdrop       │ │
│  │ • Cursor Simulator │   │ • Keyframe Buddy State Physics │ │
│  │ • Auth Modal UI    │   │ • Responsive Breakpoints       │ │
│  └─────────┬──────────┘   └───────────────┬────────────────┘ │
│            │                              │                  │
│            └──────────────┬───────────────┘                  │
│                           │                                  │
│         ┌─────────────────┴─────────────────┐                │
│         ▼                                   ▼                │
│  ┌──────────────┐                   ┌──────────────┐         │
│  │    app.js    │                   │firebase-     │         │
│  │ • LERP Mouse │                   │config.js     │         │
│  │ • Audio Demo │                   │ • Google Auth│         │
│  │ • Scroll Nav │                   │ • User State │         │
│  └──────────────┘                   └──────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

| Component | Technology | Description |
|---|---|---|
| **Structure** | **HTML5** | Semantic, accessible layout with OpenGraph SEO metadata, ARIA attributes, and structured sections. |
| **Styling** | **Vanilla CSS3** | Custom design system using CSS variables (`--bg: #080808`, `--accent: #800a1e`), glassmorphism backdrop filters, and smooth keyframe animations. |
| **Interactions** | **Vanilla JavaScript (ES6+)** | Hardware-accelerated `requestAnimationFrame` render loop for cursor physics, sound demo players, and scroll-reveal observers. |
| **Authentication** | **Firebase Auth (v9 Compat)** | Google OAuth popup sign-in, user avatar chips, and authentication gating. |
| **Typography** | **Google Fonts** | [`Inter`](https://fonts.google.com/specimen/Inter) for clean UI reading and [`JetBrains Mono`](https://fonts.google.com/specimen/JetBrains+Mono) for hotkeys and technical labels. |

---

## ✨ Interactive Features

### 1. 🔴 In-Browser Ambient Cursor Co-pilot Simulator
- Floats beside your mouse pointer right in the web browser using a 60fps `requestAnimationFrame` loop with Linear Interpolation (LERP) physics.
- Dynamic animated eyes with pupils tracking mouse velocity and direction.
- Interactive state toggles demonstrating **Idle**, **Listening** (crimson aura), **Thinking** (ruby spin), **Speaking** (talk pulse), and **Gliding**.

### 2. 🔐 Google OAuth via Firebase
- Built-in user authentication supporting Google Sign-In via popup.
- Displays an interactive user avatar chip and profile dropdown upon login.
- Clean fallback handling if Firebase keys are unconfigured.

### 3. 🎙️ Multimodal Voice & Audio Showcase
- Interactive soundboard demonstrating **Sarvam AI** natural Indian English and Hindi voice synthesis (`bulbul:v3` & `bulbul:v2`).
- Playable voice samples for speakers **Shubh**, **Anushka**, **Aditya**, and **Priya**.

### 4. 🎛️ Guided Workflow Visualizer
- Step-by-step visual demonstration of Pointly's real-world desktop capabilities:
  - Drafting emails in Microsoft Word with automatic clipboard synchronization.
  - Chrome browser omnibox pointing and hands-free webpage scrolling.
  - Windows OS window minimization and desktop file locating.

### 5. 📱 Responsive Glassmorphic Mobile Layout
- Fully responsive across desktop, tablet, and smartphone screens.
- Slide-out glassmorphic drawer menu for mobile navigation.

---

## 🔒 Firebase Authentication

Authentication is pre-configured in [`firebase-config.js`](file:///d:/Pointly/Pointly-Web/firebase-config.js):

```javascript
var firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "pointlyapp.firebaseapp.com",
  projectId: "pointlyapp",
  storageBucket: "pointlyapp.firebasestorage.app",
  messagingSenderId: "560996752819",
  appId: "YOUR_APP_ID"
};
```

To connect your own Firebase project:
1. Create a project at [console.firebase.google.com](https://console.firebase.google.com/).
2. Enable **Authentication** with the **Google Sign-In** provider.
3. Add your authorized domains (e.g. `localhost`, `your-domain.netlify.app`).
4. Replace the credentials inside `firebase-config.js`.

---

## 📂 File Structure

```
Pointly-Web/
├── app.js               # In-browser cursor simulator, sound demo, and UI controllers
├── firebase-config.js   # Firebase Auth initialization and Google provider setup
├── index.html           # Main semantic HTML structure, sections, and SEO tags
├── package.json         # Local dev scripts (serve on port 3000)
├── README.md            # Web portal documentation
└── style.css            # Complete design system, glassmorphism tokens, and animations
```

---

## 🚢 Deployment Guide

Pointly-Web is a 100% static web application that deploys in seconds:

### Netlify (Recommended)
1. Drag and drop the `Pointly-Web` folder into [Netlify Drop](https://app.netlify.com/drop), or
2. Connect your Git repository with:
   - **Base directory**: `Pointly-Web`
   - **Publish directory**: `Pointly-Web` (or `.`)
   - **Build command**: *(Leave blank)*

### Vercel
```powershell
cd Pointly-Web
npx vercel
```

### GitHub Pages
1. In your GitHub repository settings, navigate to **Pages**.
2. Select the branch and set the root/folder to `/Pointly-Web`.
3. Save to publish instantly.

---

<div align="center">
  <sub>Pointly Web Portal · Developed by Team XOR</sub>
</div>

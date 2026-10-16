# Untoz Browser

> A premium, minimalist desktop browser built by Untoz.

Untoz Browser is a modern desktop web browser designed around speed, simplicity, privacy, and a seamless connection to the Untoz ecosystem.

The project combines a clean, premium interface with a powerful browser engine, creating a browsing experience designed for the next generation of the web.

---

## 🚧 Development Status

**Untoz Browser is currently in active development.**

What works in the current shell:

- Electron window with a sandboxed native page view per tab
- Address bar, back, forward, reload, stop, and homepage
- Tabs: create, close, and switch, each with its own page
- Local bookmarks, history, and settings stored on the computer
- Navigation limited to `http` and `https`

Not in this version yet: download manager, workspaces, extensions, sync, and Untoz account services. The Windows portable package is produced with `npm run build` on Windows. GitHub Actions is not a release path for this repository.

## Scripts

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run dev
npm run build:render
npm run build
```

---

## ✨ Vision

Untoz Browser aims to provide:

- ⚡ Fast and responsive browsing
- 🎨 A clean, premium interface
- 🔒 Privacy-focused browsing
- 🧩 Seamless integration with the Untoz ecosystem
- 📑 Modern tab management
- 🎬 Smooth animations and interactions
- 🖥️ A powerful desktop browsing experience
- 🚀 A foundation for future Untoz services and products

---

## 🛠️ Technology Stack

Untoz Browser is built using modern web and desktop technologies.

| Technology | Purpose |
|------------|---------|
| **Electron** | Desktop application framework |
| **React** | User interface |
| **TypeScript** | Type-safe application development |
| **Vite** | Development server and build tooling |
| **Tailwind CSS** | UI styling |
| **Zustand** | Application state management |
| **Framer Motion** | Animations and interactions |

---

## 📁 Project Structure

```text
untoz-browser/
├── assets/
│   └── logo/
│
├── electron/
│   ├── main.ts
│   └── preload.ts
│
├── public/
│
├── src/
│   ├── components/
│   │   ├── data-display/
│   │   ├── forms/
│   │   ├── navigation/
│   │   ├── overlays/
│   │   └── ui/
│   │
│   ├── pages/
│   ├── store/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── index.html
├── package.json
├── package-lock.json
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts

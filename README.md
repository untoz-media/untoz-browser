# Untoz Browser

Current browser: independent native tabs, a navy start page, local profile,
favorites, history, downloads, private windows, and privacy defaults (EasyList,
EasyPrivacy, HTTPS-only, third-party cookie blocking, limited fingerprinting
protection). See [the implementation report](docs/B001-B013-report.md) and
[the 2026-10-16 notes](docs/B014-hardening.md).

Use Node.js 22.12+ (tested with Node 22 and 24). Run `npm install`, then `npm run dev`.
`npm run build` produces the Windows portable executable under `release/`.
This tree uses Electron 44.8.0. Electron 44 is supported until 2027-03-02.
Electron 45 was still beta on 2026-10-16 and is not used.
Checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:electron`,
and `npm run test:dev`. Integration tests use temporary isolated profiles.
Close the dev server before running build/integration scripts; both emit to
`dist-electron/`. For a separate profile, launch with `--user-data-dir=<absolute path>`.

No account, cloud sync, telemetry, generated art, or AI components are required.

> A premium, minimalist desktop browser built by Untoz.

Untoz Browser is a modern desktop web browser designed around speed, simplicity, privacy, and a seamless connection to the Untoz ecosystem.

The project combines a clean, premium interface with a powerful browser engine, creating a browsing experience designed for the next generation of the web.

---

## 🚧 Development Status

**Untoz Browser is currently in active development.**

The project is being developed incrementally, starting with the core browser engine and navigation system before expanding into advanced browser features.

Expect frequent changes while the architecture and core functionality continue to evolve.

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

| Technology                 | Purpose                              |
| -------------------------- | ------------------------------------ |
| **Electron**               | Desktop application framework        |
| **React**                  | User interface                       |
| **TypeScript**             | Type-safe application development    |
| **Vite**                   | Development server and build tooling |
| **Tailwind CSS**           | UI styling                           |
| **Zustand**                | Application state management         |
| **Native WebContentsView** | Independent Chromium pages           |

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
```

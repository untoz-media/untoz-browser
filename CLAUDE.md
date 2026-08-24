# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Setup & Scripts

To start development:

```bash
# Install dependencies
npm install

# Start development server (runs Vite + Electron)
npm run dev
```

Available npm scripts:
- `npm run dev` - Starts both Vite dev server and Electron (concurrently)
- `npm run dev:render` - Starts only the Vite dev server (React UI)
- `npm run dev:electron` - Starts Electron with the built renderer
- `npm run build` - Builds for production (renders UI then packs with electron-builder)
- `npm run build:render` - Production build of the React UI via Vite
- `npm run build:electron` - Packs the built UI with electron-builder
- `npm run preview` - Previews the production build locally with Vite
- `npm run lint` - Runs ESLint on all JavaScript/TypeScript files
- `npm run format` - Formats code with Prettier

## Project Architecture

Untoz Browser follows a **feature-based, modular architecture** using Electron as the desktop shell and React for the UI.

- **Main Process** (`electron/main.ts`): Electron entry point (TypeScript) handles window creation, menu, IPC.
- **Preload Script** (if any): Located in `electron/preload.ts` (TypeScript) for secure IPC bridging.
- **Renderer Process** (`src/`): React application rendered in Electron's Chromium view.
  - Entry point: `src/main.tsx` → ReactDOM renders `<App />`.
  - Routing: Managed by `react-router-dom` in `src/App.tsx`.
  - State Management: Zustand stores in `src/store/` (to be expanded).
  - Styling: Tailwind CSS via `tailwind.config.js` and PostCSS.

### Folder Overview

```
src/
├── main.tsx          # React entry point
├── index.css         # Global CSS/Tailwind base
├── App.tsx           # Root layout with router, header, footer
├── pages/            # Top-level route components (e.g., Home.tsx)
├── components/       # Reusable UI components (organized by type)
│   ├── ui/           # Primitive UI elements (Button, Input, Avatar, etc.)
│   ├── navigation/   # Nav-specific components (Sidebar, Navbar, ContextMenu)
│   ├── forms/        # Form elements (Search, etc.)
│   ├── data-display/ # Cards, lists, etc.
│   └── overlays/     # Dialogs, modals, tooltips, toasts
├── modules/          # Feature modules (planned; each feature self-contained)
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries and helpers
├── store/            # Zustand state slices
└── utils/            # Standalone utility functions
```

### Component Organization

Components follow the **Untoz Design System** (UDS). All UI must be built from or extend components in `src/components/ui/` or related subfolders. Variants (size, color, state) are controlled via props.

### Feature Modules (Future)

As the browser grows, each major feature (tab management, bookmarks, settings, etc.) will live in `src/modules/` with its own:
- `components/` (feature-specific UI)
- `hooks/` (feature-specific hooks)
- `utils/` (feature-specific utilities)
- `index.ts` (public API)

This keeps features encapsulated and reduces cross-dependencies.

## Coding Standards

- **TypeScript**: Strict mode enforced via `tsconfig.json`. All new files must be `.tsx` (React) or `.ts`.
- **Linting**: ESLint with React plugin (see `.eslintrc.js` if present; otherwise relies on package.json scripts). Run `npm run lint` to verify.
- **Formatting**: Prettier via `npm run format`. Code must be formatted before committing.
- **Imports**: Use absolute imports scoped to `src/` (e.g., `import { Button } from '@/components/ui/Button'` if configured; otherwise relative).
- **Naming**: PascalCase for components and types, camelCase for variables/functions, UPPER_SNAKE for constants.

## Building and Packaging

- Development uses Vite for fast Hot Module Replacement (HMR).
- Production build:
  1. Vite bundles React app into `dist/` (`npm run build:render`).
  2. Electron-Bundler packages `dist/` with Electron into platform-specific executables (`npm run build:electron`).
- Ensure `npm run build` completes without errors before creating releases.

## Testing

*Note: Automated tests are not yet configured in this early stage.*  
When adding tests:
- Place test files alongside source files with `.test.tsx` suffix.
- Use Vitest or Jest (to be configured) with React Testing Library.
- Ensure `npm test` script exists and passes.

## Common Tasks

### Adding a New UI Component
1. Create the component in the appropriate subfolder under `src/components/` (e.g., `src/components/ui/NewControl.tsx`).
2. Follow existing patterns: export a named or default export.
3. Use Tailwind CSS for styling; adhere to UDS token palette (colors, spacing, radii).
4. Export from an index barrel if appropriate (e.g., `src/components/ui/index.ts`).

### Adding a New Page/Route
1. Add a component in `src/pages/` (e.g., `src/pages/Settings.tsx`).
2. Import and add a `<Route>` in `src/App.tsx` within `<Routes>`.
3. Link from navigation components (Sidebar, Navbar) as needed.

### Managing State with Zustand
1. Create a slice in `src/store/` (e.g., `src/store/useTabsStore.ts`).
2. Define state, actions, and selectors.
3. Use the hook in components: `const { tabs, addTab } = useTabsStore();`.

### Styling & Design System
- Use Tailwind utility classes and extend `tailwind.config.js` for brand tokens only after design review.
- For complex styling, consider CSS modules or styled-components if justified (prefer Tailwind).

## Dependencies

- Avoid adding new dependencies unless essential. Prefer utility functions or existing libraries.
- When adding a dependency, run `npm install <package>` and, if TypeScript, `@types/<package>` if needed.
- Update documentation in `package.json` if the dependency affects build/runtime.

## Performance & Quality Gates

Before considering work complete:
- Run `npm run lint` and fix all warnings/errors.
- Run `npm run format` to ensure consistent formatting.
- Verify `npm run dev` starts without errors and the UI loads.
- For production candidate: run `npm run build` and confirm Electron launches.

## Repository Hygiene

- Keep commits atomic and messages conventional (`feat:`, `fix:`, `docs:`, etc.).
- Do not commit generated files (e.g., `dist/`, `node_modules/`).
- Update `MISSION.md` and `ROADMAP.md` when significant direction changes occur.

---  
*This document evolves with the project. Refer to it as the source of truth for development practices.*
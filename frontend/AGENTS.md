# Frontend Guidelines

## Project Structure & Module Organization

This directory is the React/Vite frontend for `jcourse`. Application code lives in `src/`. Pages are in `src/pages`, API clients and DTOs in `src/api`, data hooks in `src/hooks`, shared UI primitives in `src/components/ui`, feature components in `src/components/*`, routing in `src/router.tsx`, utility helpers in `src/lib`, React context in `src/contexts`, and frontend config in `src/config`. MSW handlers and fixtures live in `src/mocks`; static assets and the generated MSW worker live in `public/`. PWA options are in `pwa.config.ts` and wired through `vite.config.ts`.

## Build, Test, and Development Commands

- `pnpm dev` starts the Vite development server.
- `pnpm build` runs the production build and type-checks the app.
- `pnpm lint` runs oxlint across the project.
- `pnpm typecheck` runs TypeScript without bundling.
- `pnpm test` runs Vitest with `--passWithNoTests`.
- `pnpm preview` serves the built app locally.
- `pnpm format` runs oxfmt across the project.
- `VITE_ENABLE_MOCKS=true pnpm dev` starts Vite with MSW mocks instead of requiring a live backend.

## Coding Style & Naming Conventions

Use TypeScript, React function components, TanStack Router, TanStack Query, TanStack Form, Tailwind CSS, shadcn-style primitives, Remix Icon, and the existing path alias such as `@/components/ui/button`. Keep component names in PascalCase, hooks as `useThing`, and page files in kebab-case such as `course-detail-page.tsx`. Prefer existing UI primitives and feature folders before introducing new abstractions. Keep state, API calls, and formatting logic close to the feature that uses them. API calls should go through `src/api/client.ts` so credentials, CSRF handling, and `HttpError` behavior stay consistent.

## Testing Guidelines

Frontend changes should pass `pnpm lint` and `pnpm typecheck`; run `pnpm test` and `pnpm build` when changing hooks, API clients, routing, PWA behavior, or build configuration. Add focused Vitest coverage for nontrivial hooks, client behavior, and UI logic when a change carries real branching or data transformation. Keep tests near the code they exercise when practical.

## Commit & Pull Request Guidelines

Keep commits short and imperative, with an area or type when useful. Pull requests should summarize the user-visible change, list commands run, and include screenshots for UI updates.

## Security & Configuration Tips

Do not commit real credentials, API tokens, or environment-specific overrides. Preserve the existing API contract when changing frontend requests or route handling, and verify that new UI paths still work with the current auth flow. The app uses relative `/api` requests by default; local development proxies them to `http://localhost:8080` in `vite.config.ts`.

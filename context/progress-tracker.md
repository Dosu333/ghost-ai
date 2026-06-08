# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 3: Authentication complete

## Current Goal

- Move from project management wiring into the first project-scoped workspace route and canvas-ready editor flows.

## Completed

- Design system foundation implemented.
- shadcn/ui configured for this Next.js 16 app.
- Required primitives added: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea.
- `lucide-react` installed.
- `lib/utils.ts` added with reusable `cn()` helper.
- Dark-only theme tokens defined in `app/globals.css` and exercised in the app shell.
- Shared editor navbar implemented with left, center, and right sections plus sidebar toggle state.
- Floating project sidebar implemented with overlay behavior, slide-in transition, tabs, empty states, and bottom action button.
- Reusable dialog frame pattern added for future editor dialogs using the shared color token system.
- The app landing route now previews the editor shell foundation instead of the design system demo.
- `@clerk/ui` is installed so Clerk's `dark` theme can be applied through the root provider.
- Clerk is now wired into the Next.js app root with a shared `ClerkProvider` appearance config based on the app token system.
- Sign-in and sign-up pages are implemented with Clerk components and a minimal two-panel auth layout.
- Route protection is enforced through root-level `proxy.ts` with public auth paths and protected-by-default behavior elsewhere.
- The landing route now redirects authenticated users to `/editor` and unauthenticated users to the Clerk sign-in flow.
- The editor navbar now includes Clerk's built-in `UserButton` for account actions and sign-out.
- The `/editor` home screen now shows the minimal project entry state with a centered `New Project` call to action.
- Mock project data now powers the sidebar tabs, including owned and shared project lists.
- Owner-only sidebar actions now open wired rename and delete dialogs.
- Create, rename, and delete project dialogs are implemented with a dedicated state hook, live slug preview, rename autofocus, Enter-to-submit, and destructive delete confirmation.
- Mobile sidebar interaction now includes a backdrop scrim and outside-tap close behavior.
- Prisma foundation is implemented with folder-based schema models for `Project` and `ProjectCollaborator`, including the required status enum, relations, unique constraints, and indexes.
- `lib/prisma.ts` now exports a cached Prisma singleton that switches between Prisma Accelerate for `prisma+postgres://` URLs and `@prisma/adapter-pg` for direct PostgreSQL URLs.
- The first Prisma migration SQL was generated locally at `prisma/migrations/20260608003036_init_project_data/migration.sql`, and Prisma Client generation now targets the standard `@prisma/client` output.
- Backend project API routes are implemented at `app/api/projects` and `app/api/projects/[projectId]` for authenticated list, create, rename, and delete operations.
- Project API auth rules now explicitly return `401` for unauthenticated requests and `403` for non-owner rename/delete attempts, with consistent JSON error bodies.
- Project creation now defaults missing names to `Untitled Project`, while rename requires a non-empty string name.
- `lib/prisma.ts` now normalizes the cached Prisma export to a single client type so Next.js production type checking passes with either Accelerate or direct PostgreSQL connections.
- The `/editor` home page now stays server-rendered for its initial load and receives owned/shared project lists from a shared server data helper instead of mock client state.
- Real editor project wiring now uses `hooks/use-project-actions.ts` for create, rename, and delete mutations, including router refreshes and active-workspace delete redirects.
- Project creation now previews a room ID, persists that same ID through `POST /api/projects`, and navigates to `/editor/[projectId]` so the project ID and room ID remain aligned.
- A minimal protected `/editor/[projectId]` route now exists for project-scoped navigation, active project highlighting, and post-create workspace entry.
- Sidebar project items now use real owned/shared data, link into project routes, and keep owner-only rename/delete actions.
- Editor project loading now treats Clerk `currentUser()` failures as non-fatal for owned-project rendering, so `/editor` and owner workspace access continue to work when collaborator email lookup is temporarily unavailable.

## In Progress

- None currently.

## Next Up

- Start the project-scoped editor canvas work now that project navigation and real workspace entry routes exist.

## Open Questions

- None currently.

## Architecture Decisions

- Standard Clerk redirect URLs are configured through Clerk's existing `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL` environment variables so proxy protection and server redirects share the same route source.

## Session Notes

- The landing page now acts as an editor workspace shell preview with a floating overlay sidebar.
- Production build verification required network access because the existing root layout fetches Geist fonts with `next/font/google`.
- Authentication is enforced via `proxy.ts`, matching the Next.js 16 proxy file convention rather than deprecated `middleware.ts`.
- Auth verification completed with a successful `npm run build` after allowing network access for the existing Google font fetch.
- Prisma schema validation and client generation succeeded after adding `@prisma/extension-accelerate` for the Accelerate code path.
- The initial Prisma migration was later applied successfully with `prisma migrate deploy`, so the `Project` and `ProjectCollaborator` tables now exist in the configured PostgreSQL database.
- Project API backend implementation completed without wiring the existing mock editor UI, matching the current feature spec scope.
- `npm run build` passed after verifying the new API routes and normalizing the Prisma client export for strict Next.js 16 type checking.
- The editor home flow now uses real server-fetched project data on first render and no longer depends on mock sidebar/dialog project state.
- The create flow now generates a stable room ID preview with a short suffix, persists that ID as the project ID, and routes directly into the new workspace path.
- A lightweight project workspace route exists purely to support protected project navigation until the canvas implementation lands.
- `npx tsc --noEmit` passes for the real project wiring changes; `npm run build` remains blocked in this sandbox by the existing `next/font/google` Geist fetch.
- The editor project helpers now fall back cleanly when Clerk's backend `currentUser()` fetch fails, preventing shared-project lookup issues from crashing owner route renders.

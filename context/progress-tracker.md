# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 4: Realtime collaboration foundation

## Current Goal

- Layer the next editor controls on top of the collaborative canvas, starting with AI generation workflows.

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
- The landing route `/` is explicitly included in the shared Clerk public route matchers so unauthenticated requests can reach the server redirect logic in `app/page.tsx`.
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
- `lib/prisma.ts` now defers `DATABASE_URL` validation until Prisma is first used, keeping module imports and static analysis safe while preserving runtime DB checks.
- The `/editor` home page now stays server-rendered for its initial load and receives owned/shared project lists from a shared server data helper instead of mock client state.
- Real editor project wiring now uses `hooks/use-project-actions.ts` for create, rename, and delete mutations, including router refreshes and active-workspace delete redirects.
- Project creation now previews a room ID, persists that same ID through `POST /api/projects`, and navigates to `/editor/[projectId]` so the project ID and room ID remain aligned.
- A minimal protected `/editor/[projectId]` route now exists for project-scoped navigation, active project highlighting, and post-create workspace entry.
- Sidebar project items now use real owned/shared data, link into project routes, and keep owner-only rename/delete actions.
- Editor project loading now treats Clerk `currentUser()` failures as non-fatal for owned-project rendering, so `/editor` and owner workspace access continue to work when collaborator email lookup is temporarily unavailable.
- `lib/project-access.ts` now centralizes current Clerk identity lookup and owner-or-collaborator access checks for project-scoped server rendering.
- `/editor/[projectId]` now stays server-rendered, redirects unauthenticated users to Clerk sign-in, and renders `AccessDenied` for missing or unauthorized projects.
- The project workspace route now renders the editor shell with the active project name in the navbar, left sidebar highlighting, a central canvas placeholder, and a right AI sidebar placeholder.
- `components/editor/access-denied.tsx` now provides the locked access state with a return link to `/editor`.
- Share management is now implemented through `app/api/projects/[projectId]/collaborators`, covering collaborator listing, owner-only invite, and owner-only removal.
- Collaborator API responses now enrich stored emails with Clerk display names and avatar images when available, while falling back to email-only entries when a Clerk user is not found.
- The workspace `Share` button now opens a dedicated dialog where owners can invite, remove, and copy the project link with temporary `Copied!` feedback, while collaborators see a read-only collaborator list.
- The share dialog access list now includes the project owner with Clerk-enriched identity details and a visible owner role badge, while keeping removal actions limited to invited collaborators.
- Clerk auth page form appearance is now shared through `lib/clerk.ts`, so sign-in and sign-up stay visually aligned without duplicated inline config.
- `liveblocks.config.ts` now defines the shared presence contract for cursor state and AI thinking state, plus typed Liveblocks user metadata for display name, avatar, and cursor color.
- `lib/liveblocks.ts` now provides a cached `@liveblocks/node` client with lazy `LIVEBLOCKS_SECRET_KEY` validation and deterministic user-to-cursor-color mapping.
- `app/api/liveblocks-auth` now authenticates Clerk users, verifies project membership, syncs Liveblocks room membership from project access data, and returns ID-token auth responses with user metadata.
- Project collaborator helpers now expose Clerk user ID resolution for project members so Liveblocks room permissions can stay aligned with owner/collaborator access.
- The editor canvas now includes a floating bottom shape panel with draggable entries for rectangle, diamond, circle, pill, cylinder, and hexagon.
- Shape drag payloads now include the supported shape name plus sensible default width and height data, and the canvas drop flow creates synced custom canvas nodes at the dropped React Flow position.
- A basic custom `canvasNode` renderer now displays newly dropped nodes as bordered rectangles with centered labels so shape-created nodes are immediately visible on the collaborative canvas.
- The project workspace canvas now renders as a full-bleed editor surface with no rounded outer frame, while the AI panel floats as a right-side overlay instead of reserving canvas width.
- Verification completed for this unit with both `npx tsc --noEmit` and `npm run build`.

## In Progress

- None currently.

## Next Up

- Add AI generation controls on top of the collaborative canvas now that the shape-panel drop flow is in place.

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
- The project workspace route now includes the verified shell layout and protected access states ahead of the real canvas implementation.
- `npx tsc --noEmit` and `npm run build` both pass for the workspace-shell implementation once the existing `next/font/google` Geist fetch is allowed.
- The editor project helpers now fall back cleanly when Clerk's backend `currentUser()` fetch fails, preventing shared-project lookup issues from crashing owner route renders.
- The workspace-shell feature is now implemented and verified; the only build escalation required was the existing `next/font/google` Geist fetch.
- Share dialog implementation now includes owner-only collaborator management, Clerk-enriched collaborator identity display, and copy-link feedback inside the project workspace.
- The duplicated Clerk auth form `appearance` config was consolidated into a shared export and will be covered by follow-up type-check validation for this small refactor.
- Prisma client initialization is now lazy, so build-time or import-only evaluation no longer throws before a real database call requests the client.
- Clerk public route matching now includes `/`, preventing proxy auth protection from intercepting the home route before its redirect logic runs.
- Liveblocks room auth now uses the project ID as the room ID and updates room `usersAccesses` from the current project membership set before issuing an ID token.
- Production build verification still requires network access because the existing root layout fetches Geist fonts through `next/font/google`.
- The base-canvas unit expects the client provider to authenticate by room ID, so `/api/liveblocks-auth` should accept the provider-posted room payload while preserving the project ID to room ID invariant.
- The shape-panel unit is now implemented and verified; `npm run build` passed after allowing the existing Next.js font fetch used by the shared Geist setup.
- The workspace shell now treats the canvas as the base layer for project routes, so both side panels can hover above it without shrinking the collaborative surface.

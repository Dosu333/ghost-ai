# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 3: Authentication complete

## Current Goal

- Move from mock project management into real project creation, listing, and protected navigation flows.

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

## In Progress

- None currently.

## Next Up

- Wire the editor project UI to the authenticated project APIs and replace mock state.

## Open Questions

- Applying the initial Prisma migration to the configured remote PostgreSQL database still requires explicit approval because it mutates an external datasource.

## Architecture Decisions

- Standard Clerk redirect URLs are configured through Clerk's existing `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL` environment variables so proxy protection and server redirects share the same route source.

## Session Notes

- The landing page now acts as an editor workspace shell preview with a floating overlay sidebar.
- Production build verification required network access because the existing root layout fetches Geist fonts with `next/font/google`.
- Authentication is enforced via `proxy.ts`, matching the Next.js 16 proxy file convention rather than deprecated `middleware.ts`.
- Auth verification completed with a successful `npm run build` after allowing network access for the existing Google font fetch.
- Project dialog flows are currently mock-only and mutate local client state without API calls or persistence, matching the current feature spec scope.
- Prisma schema validation and client generation succeeded after adding `@prisma/extension-accelerate` for the Accelerate code path.
- `prisma migrate dev` was not applied to the configured remote database because explicit approval is still needed before mutating that external datasource.
- Project API backend implementation completed without wiring the existing mock editor UI, matching the current feature spec scope.
- `npm run build` passed after verifying the new API routes and normalizing the Prisma client export for strict Next.js 16 type checking.

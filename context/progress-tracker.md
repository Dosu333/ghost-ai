# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 4: Realtime collaboration foundation

## Current Goal

- Implement the design-agent frontend wiring in the AI sidebar: prompt submission, realtime Trigger.dev run tracking, and active-run status display.

## Completed

- `POST /api/ai/design` now returns both `runId` and a Trigger.dev `publicToken`, so the AI sidebar can subscribe to realtime run updates immediately without depending on a second token request.
- Design-agent enqueueing now treats Trigger.dev task startup, realtime token creation, and `TaskRun` persistence as separate steps; a missing `TaskRun` table no longer causes successful runs to be reported back to the client as failed triggers.
- The AI sidebar no longer eagerly recreates `ai-status-feed` and `ai-chat` on mount; feed creation now stays lazy/write-scoped, fixing the browser-side unhandled `LiveblocksError: Feed ... already exists` promise rejections.
- The AI sidebar now uses a dedicated room-scoped Liveblocks `ai-chat` feed for collaborative chat messages, kept separate from the existing `ai-status-feed`.
- Sidebar chat messages now validate through a shared Zod-backed schema in `types/tasks.ts`, covering `sender`, `role`, `content`, and `timestamp` before rendering.
- The sidebar chat area now renders validated room messages in chronological order with sender names, timestamps, current-user alignment, and inline send failure feedback.
- The existing AI sidebar input and send button now publish user messages to `ai-chat`, clearing the draft only after a successful send.
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
- The custom `canvasNode` renderer now draws all six supported shape variants, using CSS for rectangle, pill, and circle plus scalable SVG rendering for diamond, hexagon, and cylinder.
- Shape dragging now shows a cursor-following ghost preview that matches the dragged shape and default drop size, then clears cleanly on drop or cancel.
- The project workspace canvas now renders as a full-bleed editor surface with no rounded outer frame, while the AI panel floats as a right-side overlay instead of reserving canvas width.
- Verification completed for the shape-panel unit with both `npx tsc --noEmit` and `npm run build`.
- Selected canvas nodes now show subtle built-in resize handles, with per-shape minimum sizes enforced through the existing Liveblocks-backed node change flow.
- Canvas nodes now support centered inline label editing on double-click, including placeholder rendering for empty labels, a textarea overlay while editing, live collaborative label updates as users type, `Escape`/blur exit, and drag/pan suppression during text entry.
- Node-editing verification completed with `npx tsc --noEmit`; `npm run build` was started but did not finish producing output in the sandbox during this session.
- The node-editing follow-up now keeps textarea focus stable while typing by preventing custom node remounts on each label update, exits editing on `Enter`, and restores side-only resizing by limiting label hit areas so the React Flow resizer lines stay reachable.
- Selected canvas nodes now show a floating color toolbar with the predefined palette, and swatch selection updates each node's collaborative color theme immediately through the existing Liveblocks node state flow.
- Node-colors toolbar verification completed with `npx tsc --noEmit` in the workspace and `npm run build` in a temporary repo copy after bypassing an orphaned local `.next` build lock.
- Canvas nodes now expose four subtle edge handles with unique side IDs, allowing loose-mode connections from any side to any other side while keeping the node renderer otherwise unchanged.
- New canvas connections now default to the custom `canvasEdge` type with arrowheads, rounded light strokes, and a widened interaction hit area without increasing visible edge thickness.
- Custom canvas edges now support hover/selection emphasis, right-angle smooth-step routing, inline pill labels, and double-click label editing positioned through `EdgeLabelRenderer` with `getSmoothStepPath` midpoint coordinates.
- Edge label changes now flow through the existing collaborative Liveblocks edge state using replace updates, and edge-behaviour type validation passed with `npx tsc --noEmit`.
- A floating bottom-left canvas control bar now provides zoom out, fit view, zoom in, undo, and redo actions, with undo/redo disabled states driven by Liveblocks history availability.
- Canvas zoom controls now call the active React Flow instance with short animated transitions, and the minimap has been removed from the workspace.
- Keyboard shortcut handling now lives in `hooks/use-keyboard-shortcuts`, covering `+`, `=`, `-`, `Cmd/Ctrl + Z`, `Cmd/Ctrl + Shift + Z`, and `Cmd/Ctrl + Y` while skipping editable inputs, textareas, and contenteditable fields.
- Canvas ergonomics verification completed with `npx tsc --noEmit` and `npm run build`.
- Starter template data now lives in `components/editor/starter-templates.ts`, using shared canvas node and edge types plus the existing node color palette.
- The workspace now includes a starter templates modal with scrollable template cards, lightweight diagram previews, and per-template import actions.
- The editor navbar now exposes a `Templates` entry point for project workspaces.
- Starter template imports now replace the current collaborative canvas by removing existing nodes and edges, adding the selected template graph through the existing Liveblocks React Flow state, and fitting the view afterward.
- Starter template verification completed with `npx tsc --noEmit` locally and `npm run build` in a temporary repo copy after bypassing an existing root `.next` build lock.
- Project creation now persists the validated client-provided project ID again, restoring the project ID to Liveblocks room ID invariant for newly created workspaces and returning a `409` conflict if that generated ID is already taken.
- `app/api/liveblocks-auth` now syncs rooms with a single `upsertRoom` call and logs underlying Liveblocks initialization failures on the server instead of hiding every auth-path exception behind an uninspectable generic error.
- The collaborators invite route now reuses the same response payload shape for both `GET` and `POST`, preserving the share dialog client contract while keeping `POST` at `201 Created`.
- Canvas node labels now support keyboard activation for inline editing, so pressing `Enter` or `Space` on the label button mirrors the existing double-click edit behavior.
- Presence avatars now render only inside project canvas rooms as a top-right overlay, showing collaborator-only Liveblocks avatars plus the current user's Clerk `UserButton`.
- The canvas presence overlay now collapses to just the Clerk `UserButton` when no collaborators are present and adds a conditional divider plus `+N` overflow chip when collaborators exceed five visible avatars.
- Live cursor broadcasting is now wired through room presence updates on React Flow mouse move and leave events, and the canvas renders colored collaborator cursors with attached name badges for other participants only.
- Presence overlay verification completed with `npx tsc --noEmit` and `npm run build`; production build still required the existing Next.js font/network allowance outside the sandbox.
- Liveblocks user metadata now includes collaborator email fallback, so presence cursors and avatar initials show the collaborator's email when no Clerk name or username is available.
- Cursor presence updates now stay in sync while collaborators drag nodes or multi-selections because the canvas feeds React Flow drag callbacks through the same cursor position updater used for pointer hover.
- Presence follow-up verification completed with `npx tsc --noEmit` and `npm run build`; build verification again required the existing `next/font/google` network allowance outside the sandbox.
- Collaborative cursor presence now stores shared flow-space coordinates instead of local screen pixels, so collaborator cursors stay aligned across different zoom levels and pan offsets.
- The cursor overlay now reprojects remote flow-space cursors through the local React Flow viewport on every viewport move, keeping cursor placement accurate while users pan or zoom independently.
- Cursor coordinate follow-up verification completed with `npx tsc --noEmit` and `npm run build`; build verification again required the existing `next/font/google` network allowance outside the sandbox.
- The floating AI sidebar is now separated into its own component and includes tabbed `AI Architect` and `Specs` views with a scrollable chat area, starter prompt chips, auto-resizing prompt input, and a static demo spec card.
- AI sidebar shell verification completed with `npx tsc --noEmit` in the workspace and `npm run build` in a temporary `/tmp/ghost-ai-verify` copy after bypassing an existing root `.next` build lock.
- `@vercel/blob` is now installed for canvas snapshot persistence.
- Project workspace canvas state now saves through `PUT /api/projects/[projectId]/canvas`, storing JSON in Vercel Blob and the returned blob URL on the Prisma project record.
- Project workspaces can now restore saved canvas state through `GET /api/projects/[projectId]/canvas`, but only hydrate when the connected Liveblocks room is still empty.
- A debounced `hooks/use-canvas-autosave.ts` hook now tracks collaborative node and edge changes, persists them through the canvas API, and exposes `saving`, `saved`, and `error` status for the editor UI.
- The editor navbar now includes a Save status button with manual flush support and live autosave feedback for project workspaces.
- Canvas autosave and loading verification completed with `npx tsc --noEmit` in the workspace and `npm run build` in a temporary `/tmp/ghost-ai-verify` copy after bypassing an existing root `.next` build lock.
- Canvas persistence now normalizes real React Flow snapshots before save/load, preventing autosave `400 INVALID_CANVAS` failures from optional or transient node and edge fields in existing rooms.
- Canvas persistence now uses private-access Blob reads and writes, matching the configured private store and fixing autosave `500` failures caused by public-access Blob operations.
- Autosave change detection now compares normalized persisted canvas snapshots instead of raw React Flow state, preventing click-only selection changes from triggering saves.
- Canvas deletion shortcuts now explicitly support both `Backspace` and `Delete`, matching expected editor behavior for selected nodes and edges.
- Trigger.dev is now installed in the app with pinned `@trigger.dev/sdk`, `@trigger.dev/build`, and `trigger.dev` CLI packages plus project scripts for login, local task dev, and deploy.
- Root Trigger.dev configuration now lives in `trigger.config.ts`, scanning the `trigger/` directory and including the Prisma legacy build extension through the existing `prisma.config.ts`.
- Trigger task scaffolding now exists for architecture generation and spec generation, with placeholder background-task bodies ready for the later AI workflow unit.
- Authenticated project-scoped Trigger.dev enqueue routes now exist at `app/api/projects/[projectId]/generate-architecture` and `app/api/projects/[projectId]/generate-spec`, enforcing project access before starting background runs.
- The design-agent backend API is now implemented with `POST /api/ai/design` for authenticated task enqueueing, project access checks, and persisted Trigger.dev run tracking.
- `POST /api/ai/design/token` now verifies run ownership through Prisma `TaskRun` records and returns a Trigger.dev public token scoped to the requested run.
- A new Prisma `TaskRun` model now tracks `runId`, `projectId`, `userId`, and `createdAt`, with the required unique/indexed run lookup and user-project lookup paths.
- The pending `TaskRun` Prisma migration has now been applied to the configured PostgreSQL database, so design-agent run tracking writes succeed against the live schema.
- `trigger/design-agent.ts` now runs the full AI design workflow, using Gemini to generate constrained canvas mutations and applying them through the shared Liveblocks room storage used by the collaborative editor.
- Design-agent API and logic verification completed with `npx prisma generate`, `npx prisma validate`, and `npx tsc --noEmit`; production `npm run build` remains blocked in the sandbox only by the existing `next/font/google` network fetch for Geist and Geist Mono.
- The AI sidebar is now wired to `POST /api/ai/design`, submitting real design prompts from project workspaces instead of the earlier static placeholder response.
- Liveblocks room context now wraps both the canvas and AI sidebar within project workspaces, allowing shared AI status events and AI presence to reach every connected participant in the same room.
- Liveblocks room events now include a typed `ai-status` payload used as the shared AI status feed for start, processing, completion, and failure updates.
- The design agent task now uses Gemini through `@ai-sdk/google` to generate constrained canvas operations from user prompts, validates those operations against the existing canvas schema, and applies them to the Liveblocks-backed React Flow storage.
- Supported AI canvas mutations now cover add node, move node, resize node, update node data, delete node, add edge, and delete edge while preserving the existing node shapes, color palette, and flow storage model.
- The design agent now publishes shared status messages and AI presence updates throughout a run, including collaborative Ghost AI cursor placement, visible thinking state, completion summaries, and graceful failure messages.
- Presence avatars and remote cursors now surface AI thinking state with a visible Ghost AI indicator so collaborators can see when the background agent is actively working in the room.
- Design-agent logic verification completed with `npx tsc --noEmit`; `npm run build` now fails in the sandbox only because the existing `next/font/google` Geist and Geist Mono fetches cannot reach Google Fonts without network access.
- The design agent now resolves its Gemini API key explicitly from `GOOGLE_GENERATIVE_AI_API_KEY` with `GEMINI_API_KEY` as a compatibility fallback, and throws a task-specific configuration error when neither is available in the Trigger worker environment.
- Shared AI status messages now use a validated `ai-status-feed` contract in `types/tasks.ts`, with latest-message rendering in the AI sidebar and a fallback room event bridge for immediate realtime updates.
- The AI sidebar now shows only the most recent validated shared status, disables prompt submission while shared generation is active, and keeps the rest of the panel usable.
- Remote cursor name badges now show a small spinner whenever that participant's Liveblocks presence has `thinking: true`.
- Liveblocks status publishing now writes to the shared `ai-status-feed` and broadcasts matching realtime events so feed-backed UI and room presence stay aligned.
- The legacy project Trigger route imports now no longer reference deleted task modules, restoring successful repo-wide type-check and build verification.

## In Progress

- `26-design-agent-frontend.md` is now the active unit, focused on connecting the existing Liveblocks `ai-chat` feed to the design-agent enqueue flow and Trigger.dev realtime run updates without changing backend task logic.

## Next Up

- Connect the Specs sidebar controls to the backend spec-generation workflow in a later unit after the design-agent frontend wiring is complete.

## Open Questions

- None currently.

## Architecture Decisions

- Standard Clerk redirect URLs are configured through Clerk's existing `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL` environment variables so proxy protection and server redirects share the same route source.

## Session Notes

- The design-agent API follow-up now degrades safely when `TaskRun` persistence is unavailable: the route still returns `202` plus a realtime token after a successful Trigger enqueue, and logs task-run persistence failures separately until the pending Prisma migration is applied.
- The `20260612103000_add_task_run` migration has now been deployed successfully, bringing the live database schema in sync with the `TaskRun` model used by the design-agent API and token lookup flow.
- The design-agent frontend follow-up removed mount-time Liveblocks feed creation from the AI sidebar after confirming `useCreateFeed()` rejects asynchronously; this fixes the repeated browser `unhandledRejection` noise for already-existing feeds while preserving lazy `ai-chat` creation before sends.
- The AI presence/status unit from `24-ai-presence-state.md` is now complete and verified with `npx tsc --noEmit` plus `npm run build`.
- Build verification required allowing network access for the existing `next/font/google` Geist and Geist Mono fetches in the shared app shell.
- The canvas autosave and loading unit is now complete, covering Vercel Blob persistence, project metadata updates, debounced editor saves, and room-empty guarded restore behavior.
- The canvas persistence validator now normalizes snapshots instead of rejecting older or partially populated React Flow fields, fixing the autosave `400` seen on existing project rooms.
- Canvas snapshot storage now uses authenticated Blob SDK reads plus private Blob writes, keeping persistence compatible with the current private Blob store configuration.
- The autosave hook now normalizes client snapshots before diffing or sending them, so selection and other transient UI state no longer count as persistent canvas edits.
- React Flow now receives both supported delete key codes, so selected canvas elements can be removed with either `Backspace` or `Delete`.
- The landing page now acts as an editor workspace shell preview with a floating overlay sidebar.
- The canvas ergonomics unit was tracked ahead of implementation and is now complete, covering the zoom/history control bar, shortcut hook extraction, and minimap removal.
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
- The node-shape unit is now implemented with reusable shape rendering and drag ghost behavior; `npx tsc --noEmit` passes locally, while `npm run build` still depends on allowing the existing `next/font/google` Geist fetch outside the sandbox.
- The node-editing unit is now implemented with selected-only resizing and inline collaborative label editing; `npx tsc --noEmit` passes locally, while the sandboxed `npm run build` run did not complete with additional output during verification.
- The node-editing follow-up fix is verified with `npx tsc --noEmit`; it keeps collaborative live label updates but stabilizes the node renderer identity so inline editing no longer drops focus on every keystroke.
- The node-colors toolbar unit is now implemented and verified; the workspace build lock was avoided by verifying `npm run build` from a temporary `/tmp/ghost-ai-verify` copy while keeping the same source changes.
- The edge-behaviour unit is implemented and type-checked locally; the remaining production build verification is currently blocked only by the existing `next/font/google` Geist and Geist Mono fetch during `npm run build`.
- The canvas ergonomics unit is now implemented and verified; `npx tsc --noEmit` passed locally, and `npm run build` passed after allowing network access for the existing `next/font/google` Geist and Geist Mono fetch.
- The starter template unit is now implemented and verified; production build verification was completed from a temporary `/tmp` repo copy because another `next build` process in the root workspace held the existing `.next` lock.
- The Liveblocks new-project auth regression is fixed by persisting the requested project ID during project creation and using `upsertRoom` for room initialization, which keeps fresh project workspaces aligned with the room IDs the client expects.
- The collaborators route now builds a shared response body for `GET` and `POST`, fixing the share dialog invite flow without changing the client contract.
- The canvas node label button now enters edit mode from keyboard activation as well as double-click, preserving button semantics while improving accessibility.
- The presence avatars and cursors unit is now implemented and verified; the only escalation needed for final build validation was the existing `next/font/google` network fetch in the shared app shell.
- The presence follow-up is now implemented and verified; unnamed collaborators fall back to email in Liveblocks user info, and drag interactions now keep collaborator cursors moving with node and selection drags.
- The cursor coordinate follow-up is now implemented and verified; cursor presence uses shared flow coordinates and renders accurately even when collaborators have different zoom levels or viewport positions.
- The AI sidebar shell unit is implemented as a dedicated client component while keeping the parent-controlled open/close behavior, floating placement, and right-side slide transition intact.
- The Trigger.dev foundation unit is now implemented and type-checked with `npx tsc --noEmit`; `npx trigger --version` reports `4.4.6`.
- Root `npm run build` verification could not complete in this session because another Next.js build process or stale build lock was already present in the active workspace, and the temporary `/tmp` verification fallback hit a Turbopack symlink restriction on `node_modules`.
- The design-agent API unit is now implemented and verified; the repo includes a new `TaskRun` migration SQL file, but applying that migration to the configured remote PostgreSQL database still needs an explicit follow-up deploy or `prisma migrate deploy` run outside this session.
- The design-agent logic unit is now implemented end to end for project workspaces, including Gemini-backed canvas mutations, shared AI room events, AI presence updates, and AI sidebar prompt submission.
- The Gemini provider setup now matches the Trigger worker runtime more closely by avoiding implicit AI SDK env lookup and supporting both documented API key env names directly in code.
- Production build verification is still blocked in the sandbox by the existing `next/font/google` Geist and Geist Mono fetch requirement; `npx tsc --noEmit` passes locally for the full design-agent logic change set.
- The active unit is `25-sidebar-chat-feed.md`, which intentionally scopes the AI sidebar input to collaborative room chat only and keeps it separate from backend AI task triggering.
- The sidebar chat feed unit is now complete: `npx tsc --noEmit` passes, and `npm run build` is blocked only by the existing `next/font/google` Geist and Geist Mono fetch failure in the sandbox.

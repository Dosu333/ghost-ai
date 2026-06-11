"use client"

import { UserButton } from "@clerk/nextjs"
import { Plus, Share2, Sparkles } from "lucide-react"
import { useState } from "react"

import { EditorRoomCanvas } from "@/components/editor/editor-room-canvas"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareDialog } from "@/components/editor/share-dialog"
import { Button } from "@/components/ui/button"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { EditorProject } from "@/types/projects"

interface EditorWorkspaceShellProps {
  activeProject?: EditorProject
  ownedProjects: EditorProject[]
  sharedProjects: EditorProject[]
}

export function EditorWorkspaceShell({
  activeProject,
  ownedProjects,
  sharedProjects,
}: EditorWorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const {
    activeDialog,
    closeDialog,
    isSubmitting,
    openCreateDialog,
    openDeleteDialog,
    openRenameDialog,
    projectName,
    roomIdPreview,
    selectedProject,
    setProjectName,
    submitCreateProject,
    submitDeleteProject,
    submitRenameProject,
  } = useProjectActions({
    activeProjectId: activeProject?.id ?? null,
  })

  const workspaceProject = activeProject ?? null
  const isProjectWorkspace = workspaceProject !== null

  return (
    <main className="min-h-screen bg-base text-copy-primary">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        title={workspaceProject?.name}
        rightSlot={
          <>
            {isProjectWorkspace ? (
              <>
                <Button
                  variant="outline"
                  className="rounded-xl border-surface-border bg-elevated/80 text-copy-secondary hover:bg-subtle hover:text-copy-primary"
                  type="button"
                  onClick={() => setIsShareDialogOpen(true)}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border-surface-border bg-elevated/80 text-copy-secondary hover:bg-subtle hover:text-copy-primary"
                  type="button"
                  onClick={() => setIsAiSidebarOpen((open) => !open)}
                  aria-pressed={isAiSidebarOpen}
                >
                  <Sparkles className="h-4 w-4" />
                  AI Panel
                </Button>
              </>
            ) : null}
            <UserButton
              appearance={{
                elements: {
                  avatarBox:
                    "size-9 rounded-xl ring-1 ring-(var(--border-default))",
                  userButtonTrigger:
                    "rounded-xl border border-surface-border bg-elevated/80 p-1 transition-colors hover:bg-subtle focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none",
                },
              }}
            />
          </>
        }
      />

      <ProjectSidebar
        activeProjectId={activeProject?.id}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onCreateProject={openCreateDialog}
        onRenameProject={openRenameDialog}
        onDeleteProject={openDeleteDialog}
      />

      {isProjectWorkspace ? (
        <>
          <button
            type="button"
            aria-label="Close AI panel"
            aria-hidden={!isAiSidebarOpen}
            tabIndex={isAiSidebarOpen ? 0 : -1}
            className={[
              "fixed inset-0 top-16 z-20 bg-black/45 transition-opacity duration-300 xl:hidden",
              isAiSidebarOpen
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0",
            ].join(" ")}
            onClick={() => setIsAiSidebarOpen(false)}
          />

          <aside
            className={[
              "pointer-events-none fixed top-20 right-4 bottom-4 z-30 w-[min(24rem,calc(100vw-2rem))] transition-all duration-300 ease-out",
              isAiSidebarOpen
                ? "translate-x-0 opacity-100"
                : "translate-x-[calc(100%+1.5rem)] opacity-0",
            ].join(" ")}
            aria-hidden={!isAiSidebarOpen}
          >
            <div className="pointer-events-auto flex h-full flex-col rounded-3xl border border-surface-border bg-surface/88 p-5 shadow-2xl shadow-black/20 backdrop-blur-md">
              <div className="flex items-center gap-3 border-b border-surface-border pb-4">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-surface-border bg-elevated text-ai">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-copy-primary">
                    AI Workspace
                  </h2>
                  <p className="text-sm text-copy-muted">
                    Placeholder for future chat and generation controls.
                  </p>
                </div>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <p className="max-w-xs text-center text-sm leading-6 text-copy-secondary">
                  AI actions will appear here once generation flows are added.
                </p>
              </div>
            </div>
          </aside>
        </>
      ) : null}

      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(100,87,249,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(0,200,212,0.12),transparent_26%)]" />

        <div className="relative min-h-[calc(100vh-4rem)]">
          {isProjectWorkspace ? (
            <div className="h-[calc(100vh-4rem)] w-full">
              <section className="h-full w-full overflow-hidden">
                <EditorRoomCanvas roomId={workspaceProject.id} />
              </section>
            </div>
          ) : (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
              <section className="flex w-full max-w-2xl flex-col items-center text-center">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Create a project or open an existing one
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-copy-secondary">
                  Start a new architecture workspace, or choose a project from
                  the sidebar.
                </p>
                <Button className="mt-8 rounded-xl px-5" onClick={openCreateDialog}>
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              </section>
            </div>
          )}
        </div>
      </div>

      <ProjectDialogs
        activeDialog={activeDialog}
        isSubmitting={isSubmitting}
        projectName={projectName}
        selectedProject={selectedProject}
        roomIdPreview={roomIdPreview}
        onClose={closeDialog}
        onProjectNameChange={setProjectName}
        onCreateSubmit={submitCreateProject}
        onRenameSubmit={submitRenameProject}
        onDeleteSubmit={submitDeleteProject}
      />

      {workspaceProject ? (
        <ShareDialog
          isOpen={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          projectId={workspaceProject.id}
          projectName={workspaceProject.name}
          projectRole={workspaceProject.role}
        />
      ) : null}
    </main>
  )
}

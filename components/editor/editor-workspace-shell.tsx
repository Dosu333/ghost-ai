"use client"

import { UserButton } from "@clerk/nextjs"
import {
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense"
import {
  AlertCircle,
  CheckCircle2,
  LayoutTemplate,
  LoaderCircle,
  Plus,
  Share2,
  Sparkles,
} from "lucide-react"
import { useCallback, useState } from "react"

import { AiSidebar } from "@/components/editor/ai-sidebar"
import { EditorRoomCanvas } from "@/components/editor/editor-room-canvas"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareDialog } from "@/components/editor/share-dialog"
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import { Button } from "@/components/ui/button"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { CanvasSaveStatus } from "@/types/canvas-persistence"
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
  const [isStarterTemplatesOpen, setIsStarterTemplatesOpen] = useState(false)
  const [canvasSaveStatus, setCanvasSaveStatus] =
    useState<CanvasSaveStatus>("saved")
  const [templateImportRequest, setTemplateImportRequest] = useState<{
    requestId: number
    template: CanvasTemplate
  } | null>(null)
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
  const [saveRequestId, setSaveRequestId] = useState(0)

  const handleSaveNow = useCallback(() => {
    setSaveRequestId((requestId) => requestId + 1)
  }, [])

  const saveButtonLabel =
    canvasSaveStatus === "saving"
      ? "Saving..."
      : canvasSaveStatus === "error"
        ? "Save error"
        : "Saved"

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
                  onClick={handleSaveNow}
                  disabled={canvasSaveStatus === "saving"}
                >
                  {canvasSaveStatus === "saving" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : canvasSaveStatus === "error" ? (
                    <AlertCircle className="h-4 w-4 text-[var(--state-error)]" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-[var(--state-success)]" />
                  )}
                  {saveButtonLabel}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border-surface-border bg-elevated/80 text-copy-secondary hover:bg-subtle hover:text-copy-primary"
                  type="button"
                  onClick={() => setIsStarterTemplatesOpen(true)}
                >
                  <LayoutTemplate className="h-4 w-4" />
                  Templates
                </Button>
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
            ) : (
              <div className="pointer-events-auto">
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
              </div>
            )}
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
        <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
          <RoomProvider
            id={workspaceProject.id}
            initialPresence={{
              cursor: null,
              thinking: false,
            }}
          >
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

            <AiSidebar
              isOpen={isAiSidebarOpen}
              onClose={() => setIsAiSidebarOpen(false)}
            />

            <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(100,87,249,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(0,200,212,0.12),transparent_26%)]" />

              <div className="relative min-h-[calc(100vh-4rem)]">
                <div className="h-[calc(100vh-4rem)] w-full">
                  <section className="h-full w-full overflow-hidden">
                    <EditorRoomCanvas
                      initialCanvasJsonPath={workspaceProject.canvasJsonPath ?? null}
                      onSaveStatusChange={setCanvasSaveStatus}
                      roomId={workspaceProject.id}
                      saveRequestId={saveRequestId}
                      templateImportRequest={templateImportRequest}
                    />
                  </section>
                </div>
              </div>
            </div>
          </RoomProvider>
        </LiveblocksProvider>
      ) : null}

      {!isProjectWorkspace ? (
        <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(100,87,249,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(0,200,212,0.12),transparent_26%)]" />

          <div className="relative min-h-[calc(100vh-4rem)]">
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
          </div>
        </div>
      ) : null}

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
        <>
          <ShareDialog
            isOpen={isShareDialogOpen}
            onOpenChange={setIsShareDialogOpen}
            projectId={workspaceProject.id}
            projectName={workspaceProject.name}
            projectRole={workspaceProject.role}
          />
          <StarterTemplatesModal
            isOpen={isStarterTemplatesOpen}
            onOpenChange={setIsStarterTemplatesOpen}
            templates={CANVAS_TEMPLATES}
            onImport={(template) => {
              setTemplateImportRequest({
                requestId: Date.now(),
                template,
              })
            }}
          />
        </>
      ) : null}
    </main>
  )
}

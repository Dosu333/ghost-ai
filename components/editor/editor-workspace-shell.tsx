"use client"

import { UserButton } from "@clerk/nextjs"
import { useState } from "react"
import { Plus } from "lucide-react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { useProjectDialogs } from "@/components/editor/use-project-dialogs"
import { Button } from "@/components/ui/button"

export function EditorWorkspaceShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const {
    activeDialog,
    closeDialog,
    isSubmitting,
    openCreateDialog,
    openDeleteDialog,
    openRenameDialog,
    ownedProjects,
    projectName,
    selectedProject,
    setProjectName,
    sharedProjects,
    slugPreview,
    submitCreateProject,
    submitDeleteProject,
    submitRenameProject,
  } = useProjectDialogs()

  return (
    <main className="min-h-screen bg-base text-copy-primary">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        rightSlot={
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
        }
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onCreateProject={openCreateDialog}
        onRenameProject={openRenameDialog}
        onDeleteProject={openDeleteDialog}
      />

      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(100,87,249,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(0,200,212,0.12),transparent_26%)]" />

        <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
          <section className="flex w-full max-w-2xl flex-col items-center text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Create a project or open an existing one
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-copy-secondary">
              Start a new architecture workspace, or choose a project from the
              sidebar.
            </p>
            <Button className="mt-8 rounded-xl px-5" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </section>
        </div>
      </div>

      <ProjectDialogs
        activeDialog={activeDialog}
        isSubmitting={isSubmitting}
        projectName={projectName}
        selectedProject={selectedProject}
        slugPreview={slugPreview}
        onClose={closeDialog}
        onProjectNameChange={setProjectName}
        onCreateSubmit={submitCreateProject}
        onRenameSubmit={submitRenameProject}
        onDeleteSubmit={submitDeleteProject}
      />
    </main>
  )
}

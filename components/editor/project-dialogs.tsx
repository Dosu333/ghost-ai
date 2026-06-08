"use client"

import { Trash2 } from "lucide-react"

import { EditorDialogFrame } from "@/components/editor/editor-dialog-frame"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { EditorProject } from "@/types/projects"

interface ProjectDialogsProps {
  activeDialog: "create" | "rename" | "delete" | null
  isSubmitting: boolean
  projectName: string
  selectedProject: EditorProject | null
  roomIdPreview: string
  onClose: () => void
  onProjectNameChange: (value: string) => void
  onCreateSubmit: () => Promise<void>
  onRenameSubmit: () => Promise<void>
  onDeleteSubmit: () => Promise<void>
}

export function ProjectDialogs({
  activeDialog,
  isSubmitting,
  projectName,
  selectedProject,
  roomIdPreview,
  onClose,
  onProjectNameChange,
  onCreateSubmit,
  onRenameSubmit,
  onDeleteSubmit,
}: ProjectDialogsProps) {
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  return (
    <>
      <Dialog open={activeDialog === "create"} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2rem)] border-none bg-transparent p-0 shadow-none ring-0 sm:max-w-lg"
        >
          <DialogTitle className="sr-only">Create Project</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new project and review its room ID preview.
          </DialogDescription>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void onCreateSubmit()
            }}
          >
            <EditorDialogFrame
              title="Create Project"
              description="Start a new architecture workspace and review the generated room ID as you type."
              footer={
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create Project"}
                  </Button>
                </>
              }
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="create-project-name"
                    className="text-sm font-medium text-copy-secondary"
                  >
                    Project name
                  </label>
                  <Input
                    id="create-project-name"
                    value={projectName}
                    onChange={(event) => onProjectNameChange(event.target.value)}
                    placeholder="Realtime payments architecture"
                    className="h-11 rounded-xl border-surface-border bg-surface/80 px-3 text-copy-primary"
                  />
                </div>

                <div className="rounded-2xl border border-surface-border bg-surface/70 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-copy-faint">
                    Room ID preview
                  </div>
                  <div className="mt-2 font-mono text-sm text-brand">
                    {roomIdPreview}
                  </div>
                </div>
              </div>
            </EditorDialogFrame>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === "rename"} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2rem)] border-none bg-transparent p-0 shadow-none ring-0 sm:max-w-lg"
        >
          <DialogTitle className="sr-only">Rename Project</DialogTitle>
          <DialogDescription className="sr-only">
            Rename the selected project.
          </DialogDescription>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void onRenameSubmit()
            }}
          >
            <EditorDialogFrame
              title="Rename Project"
              description={`Update the project name for ${selectedProject?.name ?? "this project"}.`}
              footer={
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl"
                    disabled={isSubmitting || !projectName.trim()}
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              }
            >
              <div className="space-y-2">
                <label
                  htmlFor="rename-project-name"
                  className="text-sm font-medium text-copy-secondary"
                >
                  Project name
                </label>
                <Input
                  id="rename-project-name"
                  autoFocus
                  value={projectName}
                  onChange={(event) => onProjectNameChange(event.target.value)}
                  className="h-11 rounded-xl border-surface-border bg-surface/80 px-3 text-copy-primary"
                />
              </div>
            </EditorDialogFrame>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === "delete"} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2rem)] border-none bg-transparent p-0 shadow-none ring-0 sm:max-w-lg"
        >
          <DialogTitle className="sr-only">Delete Project</DialogTitle>
          <DialogDescription className="sr-only">
            Permanently delete the selected project.
          </DialogDescription>
          <EditorDialogFrame
            title="Delete Project"
            description={`Delete ${selectedProject?.name ?? "this project"} from your project list.`}
            footer={
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="rounded-xl"
                  onClick={() => {
                    void onDeleteSubmit()
                  }}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4" />
                  {isSubmitting ? "Deleting..." : "Delete Project"}
                </Button>
              </>
            }
          >
            <div className="rounded-2xl border border-error/40 bg-error/10 px-4 py-3 text-sm leading-6 text-copy-secondary">
              This action cannot be undone.
            </div>
          </EditorDialogFrame>
        </DialogContent>
      </Dialog>
    </>
  )
}

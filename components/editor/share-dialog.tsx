"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Copy, Mail, Trash2, UserRound, Users } from "lucide-react"

import { EditorDialogFrame } from "@/components/editor/editor-dialog-frame"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ProjectAccessMember } from "@/types/projects"

interface ShareDialogProps {
  isOpen: boolean
  projectId: string
  projectName: string
  projectRole: "owner" | "collaborator"
  onOpenChange: (open: boolean) => void
}

interface CollaboratorsResponse {
  canManageAccess: boolean
  collaborators: ProjectAccessMember[]
}

export function ShareDialog({
  isOpen,
  projectId,
  projectName,
  projectRole,
  onOpenChange,
}: ShareDialogProps) {
  const [canManageAccess, setCanManageAccess] = useState(projectRole === "owner")
  const [collaborators, setCollaborators] = useState<ProjectAccessMember[]>([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [removingEmail, setRemovingEmail] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<number | null>(null)

  const projectLink = useMemo(() => {
    if (typeof window === "undefined") {
      return `/editor/${projectId}`
    }

    return `${window.location.origin}/editor/${projectId}`
  }, [projectId])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    let isCancelled = false

    async function loadCollaborators() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await fetch(`/api/projects/${projectId}/collaborators`)

        if (!response.ok) {
          throw new Error("Failed to load collaborators.")
        }

        const body = (await response.json()) as CollaboratorsResponse

        if (isCancelled) {
          return
        }

        setCollaborators(body.collaborators)
        setCanManageAccess(body.canManageAccess)
      } catch (error) {
        if (isCancelled) {
          return
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load collaborators."
        )
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadCollaborators()

    return () => {
      isCancelled = true
    }
  }, [isOpen, projectId])

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current)
      }
    }
  }, [])

  async function copyProjectLink() {
    try {
      await navigator.clipboard.writeText(projectLink)
      setCopied(true)

      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current)
      }

      copyTimerRef.current = window.setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      setErrorMessage("Failed to copy the project link.")
    }
  }

  async function submitInvite() {
    const email = inviteEmail.trim()

    if (!email) {
      return
    }

    setIsInviting(true)
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null
        throw new Error(body?.error?.message || "Failed to invite collaborator.")
      }

      const body = (await response.json()) as CollaboratorsResponse

      setCollaborators(body.collaborators)
      setInviteEmail("")
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to invite collaborator."
      )
    } finally {
      setIsInviting(false)
    }
  }

  async function removeCollaborator(email: string) {
    setRemovingEmail(email)
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null
        throw new Error(body?.error?.message || "Failed to remove collaborator.")
      }

      setCollaborators((currentCollaborators) =>
        currentCollaborators.filter(
          (collaborator) =>
            collaborator.role !== "collaborator" || collaborator.email !== email
        )
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to remove collaborator."
      )
    } finally {
      setRemovingEmail(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] border-none bg-transparent p-0 shadow-none ring-0 sm:max-w-2xl"
      >
        <DialogTitle className="sr-only">Share Project</DialogTitle>
        <DialogDescription className="sr-only">
          View collaborators, invite new ones, and copy the project link.
        </DialogDescription>
        <EditorDialogFrame
          title="Share Project"
          description={
            canManageAccess
              ? `Invite collaborators to ${projectName} and manage project access.`
              : `View everyone who can currently access ${projectName}.`
          }
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                className="rounded-xl"
                onClick={() => {
                  void copyProjectLink()
                }}
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            <section className="rounded-2xl border border-surface-border bg-surface/70 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-[0.18em] text-copy-faint">
                    Project link
                  </div>
                  <div className="mt-2 break-all font-mono text-sm text-brand">
                    {projectLink}
                  </div>
                </div>
              </div>
            </section>

            {canManageAccess ? (
              <section className="rounded-2xl border border-surface-border bg-surface/70 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-copy-primary">
                  <Mail className="h-4 w-4 text-brand" />
                  Invite collaborator
                </div>
                <form
                  className="mt-4 flex flex-col gap-3 sm:flex-row"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void submitInvite()
                  }}
                >
                  <Input
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="teammate@example.com"
                    className="h-11 rounded-xl border-surface-border bg-surface/80 px-3 text-copy-primary"
                  />
                  <Button
                    type="submit"
                    className="rounded-xl"
                    disabled={isInviting || !inviteEmail.trim()}
                  >
                    {isInviting ? "Inviting..." : "Invite"}
                  </Button>
                </form>
              </section>
            ) : null}

            <section className="rounded-2xl border border-surface-border bg-surface/70">
              <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3 text-sm font-medium text-copy-primary">
                <Users className="h-4 w-4 text-brand" />
                Collaborators
              </div>

              {isLoading ? (
                <div className="px-4 py-8 text-sm text-copy-secondary">
                  Loading collaborators...
                </div>
              ) : collaborators.length ? (
                <ScrollArea className="max-h-80">
                  <div className="space-y-3 p-4">
                    {collaborators.map((collaborator) => (
                      <CollaboratorRow
                        key={collaborator.email}
                        collaborator={collaborator}
                        canManageAccess={canManageAccess}
                        isRemoving={removingEmail === collaborator.email}
                        onRemove={() => {
                          void removeCollaborator(collaborator.email)
                        }}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="px-4 py-8 text-sm text-copy-secondary">
                  {canManageAccess
                    ? "No collaborators yet. Invite someone by email to share this workspace."
                    : "This project has no collaborators yet."}
                </div>
              )}
            </section>

            {errorMessage ? (
              <div className="rounded-2xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-copy-secondary">
                {errorMessage}
              </div>
            ) : null}
          </div>
        </EditorDialogFrame>
      </DialogContent>
    </Dialog>
  )
}

interface CollaboratorRowProps {
  collaborator: ProjectAccessMember
  canManageAccess: boolean
  isRemoving: boolean
  onRemove: () => void
}

function CollaboratorRow({
  collaborator,
  canManageAccess,
  isRemoving,
  onRemove,
}: CollaboratorRowProps) {
  const initials = collaborator.displayName
    ? collaborator.displayName.slice(0, 1).toUpperCase()
    : collaborator.email.slice(0, 1).toUpperCase()

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-surface-border bg-elevated/80 p-3">
      <div className="flex min-w-0 items-center gap-3">
        {collaborator.avatarImageUrl ? (
          <img
            src={collaborator.avatarImageUrl}
            alt={collaborator.displayName || collaborator.email}
            className="size-10 rounded-xl border border-surface-border object-cover"
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-xl border border-surface-border bg-subtle text-sm font-medium text-brand">
            {initials || <UserRound className="h-4 w-4" />}
          </div>
        )}

        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-copy-primary">
            {collaborator.displayName || collaborator.email}
          </div>
          <div className="flex items-center gap-2 text-sm text-copy-muted">
            {collaborator.displayName ? (
              <span className="truncate">{collaborator.email}</span>
            ) : null}
            <span className="rounded-full border border-surface-border bg-subtle px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-copy-secondary">
              {collaborator.role}
            </span>
          </div>
        </div>
      </div>

      {canManageAccess && collaborator.role === "collaborator" ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-xl text-copy-secondary hover:text-error"
          onClick={onRemove}
          disabled={isRemoving}
          aria-label={`Remove ${collaborator.email}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  )
}

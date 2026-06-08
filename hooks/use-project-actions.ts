"use client"

import { startTransition, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import type { EditorProject } from "@/types/projects"

type DialogMode = "create" | "rename" | "delete" | null

interface UseProjectActionsOptions {
  activeProjectId: string | null
}

interface ProjectResponse {
  project: {
    id: string
    name: string
  }
}

function slugifyProjectName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return slug || "untitled-project"
}

function generateShortSuffix() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 6)
  }

  return Math.random().toString(36).slice(2, 8)
}

async function readJsonResponse<T>(response: Response) {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

export function useProjectActions({
  activeProjectId,
}: UseProjectActionsOptions) {
  const pathname = usePathname()
  const router = useRouter()
  const [activeDialog, setActiveDialog] = useState<DialogMode>(null)
  const [createSuffix, setCreateSuffix] = useState("")
  const [selectedProject, setSelectedProject] = useState<EditorProject | null>(null)
  const [projectName, setProjectName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const roomIdPreview = useMemo(() => {
    const suffix = createSuffix || "preview"

    return `${slugifyProjectName(projectName)}-${suffix}`
  }, [createSuffix, projectName])

  function closeDialog() {
    setActiveDialog(null)
    setCreateSuffix("")
    setSelectedProject(null)
    setProjectName("")
    setIsSubmitting(false)
  }

  function openCreateDialog() {
    setSelectedProject(null)
    setProjectName("")
    setCreateSuffix(generateShortSuffix())
    setActiveDialog("create")
  }

  function openRenameDialog(project: EditorProject) {
    setSelectedProject(project)
    setProjectName(project.name)
    setActiveDialog("rename")
  }

  function openDeleteDialog(project: EditorProject) {
    setSelectedProject(project)
    setProjectName(project.name)
    setActiveDialog("delete")
  }

  async function submitCreateProject() {
    const trimmedName = projectName.trim()
    const roomId = `${slugifyProjectName(trimmedName)}-${createSuffix || generateShortSuffix()}`

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(trimmedName ? { id: roomId, name: trimmedName } : { id: roomId }),
      })

      if (!response.ok) {
        throw new Error("Failed to create project.")
      }

      const body = await readJsonResponse<ProjectResponse>(response)
      const nextProjectId = body?.project.id ?? roomId

      closeDialog()
      router.push(`/editor/${nextProjectId}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function submitRenameProject() {
    const trimmedName = projectName.trim()

    if (!selectedProject || !trimmedName) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to rename project.")
      }

      closeDialog()
      startTransition(() => {
        router.refresh()
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function submitDeleteProject() {
    if (!selectedProject) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete project.")
      }

      const isDeletingActiveWorkspace =
        activeProjectId === selectedProject.id ||
        pathname === `/editor/${selectedProject.id}`

      closeDialog()

      if (isDeletingActiveWorkspace) {
        router.push("/editor")
        return
      }

      startTransition(() => {
        router.refresh()
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
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
  }
}

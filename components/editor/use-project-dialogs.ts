"use client"

import { useMemo, useState } from "react"

import { INITIAL_PROJECTS, type MockProject } from "@/components/editor/project-data"

type DialogMode = "create" | "rename" | "delete" | null

function slugifyProjectName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return slug || "project-slug"
}

function wait(delayMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs)
  })
}

export function useProjectDialogs() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS)
  const [activeDialog, setActiveDialog] = useState<DialogMode>(null)
  const [selectedProject, setSelectedProject] = useState<MockProject | null>(null)
  const [projectName, setProjectName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const ownedProjects = useMemo(
    () => projects.filter((project) => project.role === "owner"),
    [projects]
  )
  const sharedProjects = useMemo(
    () => projects.filter((project) => project.role === "collaborator"),
    [projects]
  )
  const slugPreview = useMemo(
    () => slugifyProjectName(projectName),
    [projectName]
  )

  function closeDialog() {
    setActiveDialog(null)
    setSelectedProject(null)
    setProjectName("")
    setIsSubmitting(false)
  }

  function openCreateDialog() {
    setSelectedProject(null)
    setProjectName("")
    setActiveDialog("create")
  }

  function openRenameDialog(project: MockProject) {
    setSelectedProject(project)
    setProjectName(project.name)
    setActiveDialog("rename")
  }

  function openDeleteDialog(project: MockProject) {
    setSelectedProject(project)
    setProjectName(project.name)
    setActiveDialog("delete")
  }

  async function submitCreateProject() {
    const trimmedName = projectName.trim()

    if (!trimmedName) {
      return
    }

    setIsSubmitting(true)
    await wait(250)

    setProjects((currentProjects) => [
      {
        id: `project-${slugifyProjectName(trimmedName)}-${Date.now()}`,
        name: trimmedName,
        slug: slugifyProjectName(trimmedName),
        role: "owner",
      },
      ...currentProjects,
    ])

    closeDialog()
  }

  async function submitRenameProject() {
    const trimmedName = projectName.trim()

    if (!selectedProject || !trimmedName) {
      return
    }

    setIsSubmitting(true)
    await wait(250)

    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === selectedProject.id
          ? {
              ...project,
              name: trimmedName,
              slug: slugifyProjectName(trimmedName),
            }
          : project
      )
    )

    closeDialog()
  }

  async function submitDeleteProject() {
    if (!selectedProject) {
      return
    }

    setIsSubmitting(true)
    await wait(250)

    setProjects((currentProjects) =>
      currentProjects.filter((project) => project.id !== selectedProject.id)
    )

    closeDialog()
  }

  return {
    activeDialog,
    closeDialog,
    isSubmitting,
    openCreateDialog,
    openDeleteDialog,
    openRenameDialog,
    ownedProjects,
    projectName,
    setProjectName,
    selectedProject,
    sharedProjects,
    slugPreview,
    submitCreateProject,
    submitDeleteProject,
    submitRenameProject,
  }
}

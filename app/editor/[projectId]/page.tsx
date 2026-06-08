import { notFound } from "next/navigation"

import { EditorWorkspaceShell } from "@/components/editor/editor-workspace-shell"
import {
  getAccessibleEditorProject,
  getEditorProjectLists,
} from "@/lib/editor-projects"

interface EditorWorkspacePageProps {
  params: Promise<{
    projectId: string
  }>
}

export default async function EditorWorkspacePage({
  params,
}: EditorWorkspacePageProps) {
  const { projectId } = await params
  const [activeProject, { ownedProjects, sharedProjects }] = await Promise.all([
    getAccessibleEditorProject(projectId),
    getEditorProjectLists(),
  ])

  if (!activeProject) {
    notFound()
  }

  return (
    <EditorWorkspaceShell
      activeProject={activeProject}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  )
}

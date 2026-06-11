import { redirect } from "next/navigation"

import { AccessDenied } from "@/components/editor/access-denied"
import { EditorWorkspaceShell } from "@/components/editor/editor-workspace-shell"
import { getEditorProjectLists } from "@/lib/editor-projects"
import { clerkAuthPaths } from "@/lib/clerk"
import { getCurrentProjectIdentity, getProjectAccess } from "@/lib/project-access"

interface EditorWorkspacePageProps {
  params: Promise<{
    projectId: string
  }>
}

export default async function EditorWorkspacePage({
  params,
}: EditorWorkspacePageProps) {
  const { projectId } = await params
  const identity = await getCurrentProjectIdentity()

  if (!identity.userId) {
    redirect(clerkAuthPaths.signIn)
  }

  const [activeProject, { ownedProjects, sharedProjects }] = await Promise.all([
    getProjectAccess(projectId, identity),
    getEditorProjectLists(),
  ])

  if (!activeProject) {
    return <AccessDenied />
  }

  return (
    <EditorWorkspaceShell
      activeProject={activeProject}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  )
}

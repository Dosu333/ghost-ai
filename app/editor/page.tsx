import { EditorWorkspaceShell } from "@/components/editor/editor-workspace-shell"
import { getEditorProjectLists } from "@/lib/editor-projects"

export default async function EditorPage() {
  const { ownedProjects, sharedProjects } = await getEditorProjectLists()

  return (
    <EditorWorkspaceShell
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  )
}

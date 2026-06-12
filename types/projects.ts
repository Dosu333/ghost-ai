export interface EditorProject {
  canvasJsonPath?: string | null
  id: string
  name: string
  role: "owner" | "collaborator"
}

export interface ProjectCollaborator {
  avatarImageUrl: string | null
  displayName: string | null
  email: string
}

export interface ProjectAccessMember extends ProjectCollaborator {
  role: "owner" | "collaborator"
}

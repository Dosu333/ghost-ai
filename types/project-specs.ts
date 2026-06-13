export interface ProjectSpecListItem {
  createdAt: string
  fileName: string
  id: string
}

export interface ProjectSpecsListResponse {
  specs: ProjectSpecListItem[]
}

export interface ProjectSpecContent extends ProjectSpecListItem {
  markdown: string
}

export interface ProjectSpecContentResponse {
  spec: ProjectSpecContent
}

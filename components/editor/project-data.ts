export interface MockProject {
  id: string
  name: string
  slug: string
  role: "owner" | "collaborator"
}

export const INITIAL_PROJECTS: MockProject[] = [
  {
    id: "project-payments-core",
    name: "Payments Core",
    slug: "payments-core",
    role: "owner",
  },
  {
    id: "project-support-hub",
    name: "Support Hub",
    slug: "support-hub",
    role: "owner",
  },
  {
    id: "project-warehouse-sync",
    name: "Warehouse Sync",
    slug: "warehouse-sync",
    role: "collaborator",
  },
]

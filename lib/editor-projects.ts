import { prisma } from "@/lib/prisma"
import {
  getCurrentProjectIdentity,
  getProjectAccess,
} from "@/lib/project-access"
import type { EditorProject } from "@/types/projects"

interface EditorProjectLists {
  ownedProjects: EditorProject[]
  sharedProjects: EditorProject[]
}

export async function getEditorProjectLists(): Promise<EditorProjectLists> {
  const identity = await getCurrentProjectIdentity()

  if (!identity.userId) {
    return {
      ownedProjects: [],
      sharedProjects: [],
    }
  }

  const ownedProjects = await prisma.project.findMany({
    where: {
      ownerId: identity.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
    },
  })

  const sharedProjects = identity.primaryEmail
    ? await prisma.project.findMany({
        where: {
          ownerId: {
            not: identity.userId,
          },
          collaborators: {
            some: {
              collaboratorEmail: identity.primaryEmail,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
        },
      })
    : []

  return {
    ownedProjects: ownedProjects.map((project) => ({
      ...project,
      role: "owner",
    })),
    sharedProjects: sharedProjects.map((project) => ({
      ...project,
      role: "collaborator",
    })),
  }
}

export async function getAccessibleEditorProject(projectId: string) {
  const identity = await getCurrentProjectIdentity()

  return getProjectAccess(projectId, identity)
}

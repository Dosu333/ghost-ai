import { auth, currentUser } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import type { EditorProject } from "@/types/projects"

interface EditorProjectLists {
  ownedProjects: EditorProject[]
  sharedProjects: EditorProject[]
}

async function getUserEmailAddresses() {
  const user = await currentUser()

  if (!user) {
    return []
  }

  const primaryEmail = user.emailAddresses.find(
    (emailAddress) => emailAddress.id === user.primaryEmailAddressId
  )?.emailAddress
  const allEmails = user.emailAddresses.map(
    (emailAddress) => emailAddress.emailAddress
  )

  return primaryEmail
    ? [primaryEmail, ...allEmails.filter((email) => email !== primaryEmail)]
    : allEmails
}

export async function getEditorProjectLists(): Promise<EditorProjectLists> {
  const { userId } = await auth()

  if (!userId) {
    return {
      ownedProjects: [],
      sharedProjects: [],
    }
  }

  const emailAddresses = await getUserEmailAddresses()

  const [ownedProjects, sharedProjects] = await Promise.all([
    prisma.project.findMany({
      where: {
        ownerId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
      },
    }),
    emailAddresses.length
      ? prisma.project.findMany({
          where: {
            ownerId: {
              not: userId,
            },
            collaborators: {
              some: {
                collaboratorEmail: {
                  in: emailAddresses,
                },
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
      : Promise.resolve([]),
  ])

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
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const emailAddresses = await getUserEmailAddresses()
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
      collaborators: emailAddresses.length
        ? {
            where: {
              collaboratorEmail: {
                in: emailAddresses,
              },
            },
            select: {
              id: true,
            },
            take: 1,
          }
        : false,
    },
  })

  if (!project) {
    return null
  }

  const isOwner = project.ownerId === userId
  const isCollaborator = Array.isArray(project.collaborators)
    ? project.collaborators.length > 0
    : false

  if (!isOwner && !isCollaborator) {
    return null
  }

  return {
    id: project.id,
    name: project.name,
    role: isOwner ? "owner" : "collaborator",
  } satisfies EditorProject
}

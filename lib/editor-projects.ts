import { auth, currentUser } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import type { EditorProject } from "@/types/projects"

interface EditorProjectLists {
  ownedProjects: EditorProject[]
  sharedProjects: EditorProject[]
}

async function getUserEmailAddresses() {
  try {
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
  } catch {
    // Shared-project matching should not crash the editor when Clerk's
    // backend user lookup is temporarily unavailable.
    return []
  }
}

export async function getEditorProjectLists(): Promise<EditorProjectLists> {
  const { userId } = await auth()

  if (!userId) {
    return {
      ownedProjects: [],
      sharedProjects: [],
    }
  }

  const ownedProjects = await prisma.project.findMany({
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
  })

  const emailAddresses = await getUserEmailAddresses()
  const sharedProjects = emailAddresses.length
    ? await prisma.project.findMany({
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
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
      collaborators: false,
    },
  })

  if (!project) {
    return null
  }

  const isOwner = project.ownerId === userId

  if (isOwner) {
    return {
      id: project.id,
      name: project.name,
      role: "owner",
    } satisfies EditorProject
  }

  const emailAddresses = await getUserEmailAddresses()

  if (!emailAddresses.length) {
    return null
  }

  const collaboratorMatch = await prisma.projectCollaborator.findFirst({
    where: {
      projectId,
      collaboratorEmail: {
        in: emailAddresses,
      },
    },
    select: {
      id: true,
    },
  })

  if (!collaboratorMatch) {
    return null
  }

  return {
    id: project.id,
    name: project.name,
    role: "collaborator",
  } satisfies EditorProject
}

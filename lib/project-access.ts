import { auth, currentUser } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import { normalizeCollaboratorEmail } from "@/lib/project-collaborators"

export interface ProjectAccessIdentity {
  primaryEmail: string | null
  userId: string | null
}

export interface ProjectAccessResult {
  id: string
  name: string
  role: "owner" | "collaborator"
}

export async function getCurrentProjectIdentity(): Promise<ProjectAccessIdentity> {
  const { userId } = await auth()

  if (!userId) {
    return {
      primaryEmail: null,
      userId: null,
    }
  }

  try {
    const user = await currentUser()
    const primaryEmail =
      user?.emailAddresses.find(
        (emailAddress) => emailAddress.id === user.primaryEmailAddressId
      )?.emailAddress ?? null

    return {
      primaryEmail: primaryEmail ? normalizeCollaboratorEmail(primaryEmail) : null,
      userId,
    }
  } catch {
    return {
      primaryEmail: null,
      userId,
    }
  }
}

export async function getProjectAccess(
  projectId: string,
  identity: ProjectAccessIdentity
): Promise<ProjectAccessResult | null> {
  if (!identity.userId) {
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
    },
  })

  if (!project) {
    return null
  }

  if (project.ownerId === identity.userId) {
    return {
      id: project.id,
      name: project.name,
      role: "owner",
    }
  }

  if (!identity.primaryEmail) {
    return null
  }

  const collaboratorMatch = await prisma.projectCollaborator.findFirst({
    where: {
      projectId,
      collaboratorEmail: normalizeCollaboratorEmail(identity.primaryEmail),
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
  }
}

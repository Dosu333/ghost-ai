import { clerkClient } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import { jsonError } from "@/lib/project-api"
import type { ProjectCollaborator } from "@/types/projects"

interface CollaboratorBodyInput {
  email?: unknown
}

interface ParsedCollaboratorBody {
  email: string | null
  response: Response | null
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeCollaboratorEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function parseCollaboratorBody(
  request: Request
): Promise<ParsedCollaboratorBody> {
  let body: CollaboratorBodyInput

  try {
    body = (await request.json()) as CollaboratorBodyInput
  } catch {
    return {
      email: null,
      response: jsonError(400, "INVALID_JSON", "Request body must be valid JSON."),
    }
  }

  if (typeof body.email !== "string") {
    return {
      email: null,
      response: jsonError(
        400,
        "INVALID_EMAIL",
        "Collaborator email must be a string."
      ),
    }
  }

  const email = normalizeCollaboratorEmail(body.email)

  if (!EMAIL_PATTERN.test(email)) {
    return {
      email: null,
      response: jsonError(
        400,
        "INVALID_EMAIL",
        "Collaborator email must be a valid email address."
      ),
    }
  }

  return {
    email,
    response: null,
  }
}

function getUserDisplayName(user: {
  firstName: string | null
  lastName: string | null
  username: string | null
}) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()

  if (fullName) {
    return fullName
  }

  return user.username || null
}

async function getClerkUserMap(emails: string[]) {
  if (!emails.length) {
    return new Map<string, { avatarImageUrl: string | null; displayName: string | null }>()
  }

  try {
    const client = await clerkClient()
    const users = await client.users.getUserList({
      emailAddress: emails,
      limit: emails.length,
    })

    const userMap = new Map<
      string,
      { avatarImageUrl: string | null; displayName: string | null }
    >()

    for (const user of users.data) {
      const displayName = getUserDisplayName(user)

      for (const emailAddress of user.emailAddresses) {
        userMap.set(normalizeCollaboratorEmail(emailAddress.emailAddress), {
          avatarImageUrl: user.imageUrl ?? null,
          displayName,
        })
      }
    }

    return userMap
  } catch {
    return new Map<string, { avatarImageUrl: string | null; displayName: string | null }>()
  }
}

export async function getProjectCollaborators(
  projectId: string
): Promise<ProjectCollaborator[]> {
  const collaborators = await prisma.projectCollaborator.findMany({
    where: {
      projectId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      collaboratorEmail: true,
    },
  })

  const emails = collaborators.map((collaborator) =>
    normalizeCollaboratorEmail(collaborator.collaboratorEmail)
  )
  const clerkUsers = await getClerkUserMap(emails)

  return emails.map((email) => {
    const clerkUser = clerkUsers.get(email)

    return {
      avatarImageUrl: clerkUser?.avatarImageUrl ?? null,
      displayName: clerkUser?.displayName ?? null,
      email,
    }
  })
}

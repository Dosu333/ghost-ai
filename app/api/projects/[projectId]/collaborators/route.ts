import { getCurrentProjectIdentity, getProjectAccess } from "@/lib/project-access"
import {
  getProjectAccessMembers,
  parseCollaboratorBody,
} from "@/lib/project-collaborators"
import {
  getOwnedProjectForMutation,
  jsonError,
  requireAuthenticatedUser,
} from "@/lib/project-api"
import { prisma } from "@/lib/prisma"

interface ProjectCollaboratorsRouteContext {
  params: Promise<{
    projectId: string
  }>
}

export async function GET(
  _request: Request,
  context: ProjectCollaboratorsRouteContext
) {
  const authResult = await requireAuthenticatedUser()

  if (authResult.response) {
    return authResult.response
  }

  const { projectId } = await context.params
  const identity = await getCurrentProjectIdentity()
  const project = await getProjectAccess(projectId, identity)

  if (!project) {
    return jsonError(404, "NOT_FOUND", "Project not found.")
  }

  const collaborators = await getProjectAccessMembers(projectId)

  return Response.json({
    canManageAccess: project.role === "owner",
    collaborators,
  })
}

export async function POST(
  request: Request,
  context: ProjectCollaboratorsRouteContext
) {
  const authResult = await requireAuthenticatedUser()

  if (authResult.response) {
    return authResult.response
  }

  const { projectId } = await context.params
  const ownerResult = await getOwnedProjectForMutation(projectId, authResult.userId)

  if (ownerResult.response) {
    return ownerResult.response
  }

  const bodyResult = await parseCollaboratorBody(request)

  if (bodyResult.response) {
    return bodyResult.response
  }

  const ownerIdentity = await getCurrentProjectIdentity()

  if (ownerIdentity.primaryEmail && bodyResult.email === ownerIdentity.primaryEmail) {
    return jsonError(
      400,
      "OWNER_ALREADY_HAS_ACCESS",
      "The project owner already has access."
    )
  }

  const existingCollaborator = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_collaboratorEmail: {
        projectId,
        collaboratorEmail: bodyResult.email!,
      },
    },
    select: {
      id: true,
    },
  })

  if (existingCollaborator) {
    return jsonError(
      409,
      "COLLABORATOR_EXISTS",
      "This collaborator already has access."
    )
  }

  await prisma.projectCollaborator.create({
    data: {
      projectId,
      collaboratorEmail: bodyResult.email!,
    },
  })

  const collaborators = await getProjectAccessMembers(projectId)

  return Response.json({ collaborators }, { status: 201 })
}

export async function DELETE(
  request: Request,
  context: ProjectCollaboratorsRouteContext
) {
  const authResult = await requireAuthenticatedUser()

  if (authResult.response) {
    return authResult.response
  }

  const { projectId } = await context.params
  const ownerResult = await getOwnedProjectForMutation(projectId, authResult.userId)

  if (ownerResult.response) {
    return ownerResult.response
  }

  const bodyResult = await parseCollaboratorBody(request)

  if (bodyResult.response) {
    return bodyResult.response
  }

  const deletedCollaborator = await prisma.projectCollaborator.deleteMany({
    where: {
      projectId,
      collaboratorEmail: bodyResult.email!,
    },
  })

  if (deletedCollaborator.count === 0) {
    return jsonError(404, "NOT_FOUND", "Collaborator not found.")
  }

  return Response.json({ success: true })
}

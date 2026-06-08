import { prisma } from "@/lib/prisma"
import {
  getOwnedProjectForMutation,
  parseProjectBody,
  requireAuthenticatedUser,
} from "@/lib/project-api"

interface ProjectRouteContext {
  params: Promise<{
    projectId: string
  }>
}

export async function PATCH(
  request: Request,
  context: ProjectRouteContext
) {
  const authResult = await requireAuthenticatedUser()

  if (authResult.response) {
    return authResult.response
  }

  const { projectId } = await context.params
  const ownerResult = await getOwnedProjectForMutation(
    projectId,
    authResult.userId
  )

  if (ownerResult.response) {
    return ownerResult.response
  }

  const bodyResult = await parseProjectBody(request)

  if (bodyResult.response) {
    return bodyResult.response
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      name: bodyResult.name,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      canvasJsonPath: true,
      createdAt: true,
      updatedAt: true,
      ownerId: true,
    },
  })

  return Response.json({ project })
}

export async function DELETE(
  _request: Request,
  context: ProjectRouteContext
) {
  const authResult = await requireAuthenticatedUser()

  if (authResult.response) {
    return authResult.response
  }

  const { projectId } = await context.params
  const ownerResult = await getOwnedProjectForMutation(
    projectId,
    authResult.userId
  )

  if (ownerResult.response) {
    return ownerResult.response
  }

  await prisma.project.delete({
    where: { id: projectId },
  })

  return Response.json({ success: true })
}

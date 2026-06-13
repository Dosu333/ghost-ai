import { prisma } from "@/lib/prisma"
import {
  requireAccessibleSpecProject,
  serializeProjectSpecListItem,
} from "@/lib/project-specs"
import { jsonError } from "@/lib/project-api"
import type { ProjectSpecsListResponse } from "@/types/project-specs"

interface ProjectSpecsRouteContext {
  params: Promise<{
    projectId: string
  }>
}

export async function GET(
  _request: Request,
  context: ProjectSpecsRouteContext
) {
  const { projectId } = await context.params
  const accessResult = await requireAccessibleSpecProject(projectId)

  if (accessResult.response || !accessResult.project) {
    return accessResult.response
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      name: true,
      specs: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          createdAt: true,
          id: true,
        },
      },
    },
  })

  if (!project) {
    return jsonError(404, "NOT_FOUND", "Project not found.")
  }

  const responseBody: ProjectSpecsListResponse = {
    specs: project.specs.map((spec) =>
      serializeProjectSpecListItem({
        project,
        spec,
      })
    ),
  }

  return Response.json(responseBody, {
    headers: {
      "cache-control": "no-store",
    },
  })
}

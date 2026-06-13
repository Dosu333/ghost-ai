import { prisma } from "@/lib/prisma"
import {
  readProjectSpecMarkdown,
  requireAccessibleSpecProject,
  serializeProjectSpecListItem,
} from "@/lib/project-specs"
import { jsonError } from "@/lib/project-api"
import type { ProjectSpecContentResponse } from "@/types/project-specs"

interface ProjectSpecRouteContext {
  params: Promise<{
    projectId: string
    specId: string
  }>
}

export async function GET(
  _request: Request,
  context: ProjectSpecRouteContext
) {
  const { projectId, specId } = await context.params
  const accessResult = await requireAccessibleSpecProject(projectId)

  if (accessResult.response || !accessResult.project) {
    return accessResult.response
  }

  const projectSpec = await prisma.projectSpec.findFirst({
    where: {
      id: specId,
      projectId,
    },
    select: {
      createdAt: true,
      filePath: true,
      id: true,
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!projectSpec) {
    return jsonError(404, "NOT_FOUND", "Spec not found.")
  }

  const markdown = await readProjectSpecMarkdown(projectSpec.filePath)

  if (markdown === null) {
    return jsonError(
      502,
      "SPEC_PREVIEW_FAILED",
      "Unable to load this spec right now."
    )
  }

  const responseBody: ProjectSpecContentResponse = {
    spec: {
      ...serializeProjectSpecListItem({
        project: projectSpec.project,
        spec: projectSpec,
      }),
      markdown,
    },
  }

  return Response.json(responseBody, {
    headers: {
      "cache-control": "no-store",
    },
  })
}

import { prisma } from "@/lib/prisma"
import { jsonError, requireAuthenticatedUser } from "@/lib/project-api"
import {
  getCurrentProjectIdentity,
  getProjectAccess,
} from "@/lib/project-access"
import {
  getPrivateSpecBlob,
  getProjectSpecDownloadFileName,
  MARKDOWN_CONTENT_TYPE,
} from "@/lib/spec-persistence"

interface DownloadProjectSpecRouteContext {
  params: Promise<{
    projectId: string
    specId: string
  }>
}

async function requireAccessibleProject(projectId: string) {
  const authResult = await requireAuthenticatedUser()

  if (authResult.response) {
    return {
      project: null,
      response: authResult.response,
    }
  }

  const identity = await getCurrentProjectIdentity()
  const project = await getProjectAccess(projectId, identity)

  if (project) {
    return {
      project,
      response: null,
    }
  }

  const existingProject = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
    },
  })

  return {
    project: null,
    response: existingProject
      ? jsonError(
          403,
          "FORBIDDEN",
          "You do not have access to this project's specs."
        )
      : jsonError(404, "NOT_FOUND", "Project not found."),
  }
}

export async function GET(
  _request: Request,
  context: DownloadProjectSpecRouteContext
) {
  const { projectId, specId } = await context.params
  const accessResult = await requireAccessibleProject(projectId)

  if (accessResult.response || !accessResult.project) {
    return accessResult.response
  }

  const projectSpec = await prisma.projectSpec.findFirst({
    where: {
      id: specId,
      projectId,
    },
    select: {
      filePath: true,
      id: true,
      project: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!projectSpec) {
    return jsonError(404, "NOT_FOUND", "Spec not found.")
  }

  const blobResponse = await getPrivateSpecBlob(projectSpec.filePath)

  if (!blobResponse || blobResponse.statusCode !== 200 || !blobResponse.stream) {
    return jsonError(
      502,
      "SPEC_DOWNLOAD_FAILED",
      "Unable to download this spec right now."
    )
  }

  const downloadFileName = getProjectSpecDownloadFileName(
    projectSpec.project.name,
    projectSpec.id
  )

  const headers = new Headers()
  headers.set("cache-control", "no-store")
  headers.set(
    "content-disposition",
    `attachment; filename="${downloadFileName}"`
  )
  headers.set(
    "content-type",
    blobResponse.blob.contentType ?? MARKDOWN_CONTENT_TYPE
  )

  return new Response(blobResponse.stream, {
    headers,
    status: 200,
  })
}

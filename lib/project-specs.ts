import { prisma } from "@/lib/prisma"
import {
  getCurrentProjectIdentity,
  getProjectAccess,
} from "@/lib/project-access"
import { jsonError, requireAuthenticatedUser } from "@/lib/project-api"
import {
  getPrivateSpecBlob,
  getProjectSpecDownloadFileName,
} from "@/lib/spec-persistence"
import type { ProjectSpecListItem } from "@/types/project-specs"

interface AccessibleSpecProject {
  id: string
  name: string
}

export async function requireAccessibleSpecProject(projectId: string) {
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

export function serializeProjectSpecListItem(input: {
  project: AccessibleSpecProject
  spec: {
    createdAt: Date
    id: string
  }
}): ProjectSpecListItem {
  return {
    createdAt: input.spec.createdAt.toISOString(),
    fileName: getProjectSpecDownloadFileName(input.project.name, input.spec.id),
    id: input.spec.id,
  }
}

export async function readProjectSpecMarkdown(filePath: string) {
  const blobResponse = await getPrivateSpecBlob(filePath)

  if (!blobResponse || blobResponse.statusCode !== 200 || !blobResponse.stream) {
    return null
  }

  return new Response(blobResponse.stream).text()
}

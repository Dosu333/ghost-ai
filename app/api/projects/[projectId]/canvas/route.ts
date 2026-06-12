import { get, put } from "@vercel/blob"

import {
  getCanvasBlobPath,
  parseCanvasSnapshotResult,
} from "@/lib/canvas-persistence"
import { prisma } from "@/lib/prisma"
import {
  getCurrentProjectIdentity,
  getProjectAccess,
} from "@/lib/project-access"
import { jsonError, requireAuthenticatedUser } from "@/lib/project-api"
import type {
  CanvasLoadResponse,
  CanvasSaveRequestBody,
  CanvasSaveResponse,
} from "@/types/canvas-persistence"

interface ProjectCanvasRouteContext {
  params: Promise<{
    projectId: string
  }>
}

async function getAccessibleProject(projectId: string) {
  const identity = await getCurrentProjectIdentity()
  const project = await getProjectAccess(projectId, identity)

  if (!project) {
    return {
      project: null,
      response: jsonError(404, "NOT_FOUND", "Project not found."),
    }
  }

  return {
    project,
    response: null,
  }
}

export async function GET(
  _request: Request,
  context: ProjectCanvasRouteContext
) {
  const authResult = await requireAuthenticatedUser()

  if (authResult.response) {
    return authResult.response
  }

  const { projectId } = await context.params
  const accessResult = await getAccessibleProject(projectId)

  if (accessResult.response) {
    return accessResult.response
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      canvasJsonPath: true,
    },
  })

  if (!project) {
    return jsonError(404, "NOT_FOUND", "Project not found.")
  }

  if (!project.canvasJsonPath) {
    const responseBody: CanvasLoadResponse = {
      canvas: null,
      canvasJsonPath: null,
    }

    return Response.json(responseBody)
  }

  const blobResponse = await get(project.canvasJsonPath, {
    access: "private",
    useCache: false,
  }).catch(() => null)

  if (!blobResponse || blobResponse.statusCode !== 200 || !blobResponse.stream) {
    return jsonError(
      502,
      "CANVAS_LOAD_FAILED",
      "Unable to load the saved canvas for this project."
    )
  }

  let body: CanvasSaveRequestBody

  try {
    body = (await new Response(blobResponse.stream).json()) as CanvasSaveRequestBody
  } catch {
    return jsonError(
      502,
      "INVALID_CANVAS_JSON",
      "The saved canvas data could not be parsed."
    )
  }

  const canvasResult = parseCanvasSnapshotResult(body)
  const canvas = canvasResult.canvas

  if (!canvas) {
    return jsonError(
      502,
      "INVALID_CANVAS_SHAPE",
      canvasResult.error ?? "The saved canvas data is not valid."
    )
  }

  const responseBody: CanvasLoadResponse = {
    canvas,
    canvasJsonPath: project.canvasJsonPath,
  }

  return Response.json(responseBody)
}

export async function PUT(
  request: Request,
  context: ProjectCanvasRouteContext
) {
  const authResult = await requireAuthenticatedUser()

  if (authResult.response) {
    return authResult.response
  }

  const { projectId } = await context.params
  const accessResult = await getAccessibleProject(projectId)

  if (accessResult.response) {
    return accessResult.response
  }

  let body: CanvasSaveRequestBody

  try {
    body = (await request.json()) as CanvasSaveRequestBody
  } catch {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON.")
  }

  const canvasResult = parseCanvasSnapshotResult(body)
  const canvas = canvasResult.canvas

  if (!canvas) {
    return jsonError(
      400,
      "INVALID_CANVAS",
      canvasResult.error ?? "Canvas nodes and edges must match the editor schema."
    )
  }

  const canvasJson = JSON.stringify(canvas)
  const blob = await put(getCanvasBlobPath(projectId), canvasJson, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  })

  await prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      canvasJsonPath: blob.url,
    },
  })

  const responseBody: CanvasSaveResponse = {
    canvasJsonPath: blob.url,
  }

  return Response.json(responseBody)
}

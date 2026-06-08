import { prisma } from "@/lib/prisma"
import {
  DEFAULT_PROJECT_NAME,
  parseProjectBody,
  requireAuthenticatedUser,
} from "@/lib/project-api"

export async function GET() {
  const authResult = await requireAuthenticatedUser()

  if (authResult.response) {
    return authResult.response
  }

  const projects = await prisma.project.findMany({
    where: {
      ownerId: authResult.userId,
    },
    orderBy: {
      createdAt: "desc",
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

  return Response.json({ projects })
}

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedUser()

  if (authResult.response) {
    return authResult.response
  }

  const bodyResult = await parseProjectBody(request, {
    allowId: true,
    defaultName: DEFAULT_PROJECT_NAME,
  })

  if (bodyResult.response) {
    return bodyResult.response
  }

  if (!bodyResult.name) {
    return Response.json(
      {
        error: {
          code: "INVALID_NAME",
          message: "Project name is required.",
        },
      },
      { status: 400 }
    )
  }

  const project = await prisma.project.create({
    data: {
      ...(bodyResult.id ? { id: bodyResult.id } : {}),
      ownerId: authResult.userId,
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

  return Response.json({ project }, { status: 201 })
}

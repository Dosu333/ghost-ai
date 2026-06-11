import { currentUser } from "@clerk/nextjs/server"
import { LiveblocksError } from "@liveblocks/node"

import {
  LiveblocksUserInfo,
  getLiveblocks,
  getLiveblocksCursorColor,
} from "@/lib/liveblocks"
import { requireAuthenticatedUser, jsonError } from "@/lib/project-api"
import {
  getCurrentProjectIdentity,
  getProjectAccess,
} from "@/lib/project-access"
import { getProjectLiveblocksUserIds } from "@/lib/project-collaborators"

interface LiveblocksAuthBody {
  room?: unknown
  projectId?: unknown
}

function getUserDisplayName(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) {
    return null
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()

  if (fullName) {
    return fullName
  }

  return user.username || null
}

async function parseLiveblocksAuthBody(request: Request) {
  let body: LiveblocksAuthBody

  try {
    body = (await request.json()) as LiveblocksAuthBody
  } catch {
    return {
      projectId: null,
      response: jsonError(400, "INVALID_JSON", "Request body must be valid JSON."),
    }
  }

  const roomValue =
    typeof body.room === "string"
      ? body.room
      : typeof body.projectId === "string"
        ? body.projectId
        : null

  if (roomValue === null) {
    return {
      projectId: null,
      response: jsonError(
        400,
        "INVALID_PROJECT_ID",
        "Room ID must be a string."
      ),
    }
  }

  const projectId = roomValue.trim()

  if (!projectId) {
    return {
      projectId: null,
      response: jsonError(
        400,
        "INVALID_PROJECT_ID",
        "Room ID cannot be empty."
      ),
    }
  }

  return {
    projectId,
    response: null,
  }
}

async function buildLiveblocksUserInfo(userId: string): Promise<LiveblocksUserInfo> {
  const user = await currentUser().catch(() => null)
  const name = getUserDisplayName(user) ?? "Ghost AI user"

  return {
    ...(user?.imageUrl ? { avatar: user.imageUrl } : {}),
    color: getLiveblocksCursorColor(userId),
    name,
  }
}

async function ensureProjectRoom(projectId: string, projectName: string, userIds: string[]) {
  const liveblocks = getLiveblocks()
  const usersAccesses: Record<string, ["room:write"]> = {}

  for (const userId of userIds) {
    usersAccesses[userId] = ["room:write"]
  }

  try {
    await liveblocks.getRoom(projectId)
    await liveblocks.updateRoom(projectId, {
      defaultAccesses: [],
      metadata: {
        projectId,
        title: projectName,
      },
      usersAccesses,
    })
    return
  } catch (error) {
    if (!(error instanceof LiveblocksError) || error.status !== 404) {
      throw error
    }
  }

  await liveblocks.getOrCreateRoom(projectId, {
    defaultAccesses: [],
    metadata: {
      projectId,
      title: projectName,
    },
    usersAccesses,
  })
}

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedUser()

  if (authResult.response) {
    return authResult.response
  }

  const bodyResult = await parseLiveblocksAuthBody(request)

  if (bodyResult.response) {
    return bodyResult.response
  }

  const identity = await getCurrentProjectIdentity()
  const project = await getProjectAccess(bodyResult.projectId, identity)

  if (!project) {
    return jsonError(
      403,
      "FORBIDDEN",
      "You do not have access to this project."
    )
  }

  const [userInfo, projectUserIds] = await Promise.all([
    buildLiveblocksUserInfo(authResult.userId),
    getProjectLiveblocksUserIds(bodyResult.projectId),
  ])
  const roomUserIds = Array.from(
    new Set<string>([...projectUserIds, authResult.userId])
  )

  try {
    await ensureProjectRoom(bodyResult.projectId, project.name, roomUserIds)

    const { body, status } = await getLiveblocks().identifyUser(
      authResult.userId,
      {
        userInfo,
      }
    )

    return new Response(body, { status })
  } catch {
    return jsonError(
      500,
      "LIVEBLOCKS_AUTH_FAILED",
      "Unable to initialize Liveblocks access for this project."
    )
  }
}

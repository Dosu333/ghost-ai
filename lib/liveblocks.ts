import { Liveblocks } from "@liveblocks/node"

const LIVEBLOCKS_CURSOR_COLORS = [
  "#52A8FF",
  "#BF7AF0",
  "#FF990A",
  "#FF6166",
  "#F75F8F",
  "#62C073",
  "#0AC7B4",
  "#EDEDED",
] as const

declare global {
  var __ghostLiveblocksClient: Liveblocks | undefined
}

function getLiveblocksSecret() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY

  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is required to initialize Liveblocks.")
  }

  return secret
}

export function getLiveblocks() {
  if (!globalThis.__ghostLiveblocksClient) {
    globalThis.__ghostLiveblocksClient = new Liveblocks({
      secret: getLiveblocksSecret(),
    })
  }

  return globalThis.__ghostLiveblocksClient
}

export function getLiveblocksCursorColor(userId: string) {
  let hash = 0

  for (const character of userId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }

  return LIVEBLOCKS_CURSOR_COLORS[hash % LIVEBLOCKS_CURSOR_COLORS.length]
}

export interface LiveblocksUserInfo {
  color: string
  email?: string
  name: string
  avatar?: string
}

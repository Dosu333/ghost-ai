import { randomUUID } from "node:crypto"

import { get, put } from "@vercel/blob"

import { prisma } from "@/lib/prisma"

const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8"

export interface PersistedProjectSpec {
  createdAt: Date
  filePath: string
  id: string
  projectId: string
}

function slugifySegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function getProjectSpecBlobPath(projectId: string, specId: string) {
  return `specs/${projectId}/${specId}.md`
}

export function getProjectSpecDownloadFileName(
  projectName: string,
  specId: string
) {
  const normalizedProjectName = slugifySegment(projectName)
  const baseName = normalizedProjectName || "project"

  return `${baseName}-spec-${specId}.md`
}

export async function persistGeneratedSpec(input: {
  markdown: string
  projectId: string
}): Promise<PersistedProjectSpec> {
  const specId = randomUUID()
  const blob = await put(
    getProjectSpecBlobPath(input.projectId, specId),
    input.markdown,
    {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: MARKDOWN_CONTENT_TYPE,
    }
  )

  return prisma.projectSpec.create({
    data: {
      filePath: blob.url,
      id: specId,
      projectId: input.projectId,
    },
    select: {
      createdAt: true,
      filePath: true,
      id: true,
      projectId: true,
    },
  })
}

export async function getPrivateSpecBlob(filePath: string) {
  return get(filePath, {
    access: "private",
    useCache: false,
  }).catch(() => null)
}

export { MARKDOWN_CONTENT_TYPE }

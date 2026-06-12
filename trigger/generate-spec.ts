import { task } from "@trigger.dev/sdk"

import type {
  GenerateSpecTaskPayload,
  GenerateSpecTaskResult,
} from "@/lib/trigger/project-tasks"

export const generateSpecTask = task({
  id: "generate-spec",
  run: async (
    payload: GenerateSpecTaskPayload
  ): Promise<GenerateSpecTaskResult> => {
    console.log("Spec generation task received.", {
      projectId: payload.projectId,
      requestedByUserId: payload.requestedByUserId,
    })

    return {
      acceptedAt: new Date().toISOString(),
      message:
        "Trigger.dev is configured for spec generation. Replace this placeholder with the Markdown generation and Blob persistence workflow.",
      projectId: payload.projectId,
    }
  },
})

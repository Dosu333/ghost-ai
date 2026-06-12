import { task } from "@trigger.dev/sdk"

import type {
  GenerateArchitectureTaskPayload,
  GenerateArchitectureTaskResult,
} from "@/lib/trigger/project-tasks"

export const generateArchitectureTask = task({
  id: "generate-architecture",
  run: async (
    payload: GenerateArchitectureTaskPayload
  ): Promise<GenerateArchitectureTaskResult> => {
    console.log("Architecture generation task received.", {
      projectId: payload.projectId,
      requestedByUserId: payload.requestedByUserId,
    })

    return {
      acceptedAt: new Date().toISOString(),
      message:
        "Trigger.dev is configured for architecture generation. Replace this placeholder with the Liveblocks and AI workflow implementation.",
      projectId: payload.projectId,
    }
  },
})
